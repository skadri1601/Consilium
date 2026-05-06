from __future__ import annotations

import time
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class AgentStatus(Enum):
    INITIALIZING = "initializing"
    READY = "ready"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMED_OUT = "timed_out"


@dataclass
class AgentStatusEvent:
    agent_id: str
    status: AgentStatus
    timestamp: float = field(default_factory=time.time)
    round_number: int | None = None
    detail: str | None = None
    failure_class: str | None = None

    def to_dict(self) -> dict[str, Any]:
        d: dict[str, Any] = {
            "agent_id": self.agent_id,
            "status": self.status.value,
            "timestamp": self.timestamp,
        }
        if self.round_number is not None:
            d["round"] = self.round_number
        if self.detail:
            d["detail"] = self.detail
        if self.failure_class:
            d["failure_class"] = self.failure_class
        return d


_VALID_TRANSITIONS: dict[AgentStatus, set[AgentStatus]] = {
    AgentStatus.INITIALIZING: {AgentStatus.READY, AgentStatus.FAILED},
    AgentStatus.READY: {AgentStatus.GENERATING, AgentStatus.CANCELLED},
    AgentStatus.GENERATING: {AgentStatus.COMPLETED, AgentStatus.FAILED, AgentStatus.TIMED_OUT, AgentStatus.CANCELLED},
    AgentStatus.COMPLETED: set(),
    AgentStatus.FAILED: {AgentStatus.READY},
    AgentStatus.CANCELLED: set(),
    AgentStatus.TIMED_OUT: {AgentStatus.READY},
}


class AgentLifecycle:

    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self._status = AgentStatus.INITIALIZING
        self._events: list[AgentStatusEvent] = []
        self._created_at = time.time()
        self._round_attempts: dict[int, int] = {}

    @property
    def status(self) -> AgentStatus:
        return self._status

    @property
    def events(self) -> list[AgentStatusEvent]:
        return list(self._events)

    @property
    def is_terminal(self) -> bool:
        return self._status in (AgentStatus.COMPLETED, AgentStatus.CANCELLED)

    def transition(self, new_status: AgentStatus, round_number: int | None = None, detail: str | None = None, failure_class: str | None = None) -> AgentStatusEvent | None:
        valid = _VALID_TRANSITIONS.get(self._status, set())
        if new_status not in valid:
            logger.warning(
                "Invalid transition for agent %s: %s -> %s",
                self.agent_id, self._status.value, new_status.value,
            )
            return None

        event = AgentStatusEvent(
            agent_id=self.agent_id,
            status=new_status,
            round_number=round_number,
            detail=detail,
            failure_class=failure_class,
        )
        self._status = new_status
        self._events.append(event)

        if round_number is not None and new_status == AgentStatus.GENERATING:
            self._round_attempts[round_number] = self._round_attempts.get(round_number, 0) + 1

        return event

    def mark_ready(self) -> AgentStatusEvent | None:
        return self.transition(AgentStatus.READY)

    def mark_generating(self, round_number: int) -> AgentStatusEvent | None:
        return self.transition(AgentStatus.GENERATING, round_number=round_number)

    def mark_completed(self, round_number: int) -> AgentStatusEvent | None:
        return self.transition(AgentStatus.COMPLETED, round_number=round_number)

    def mark_failed(self, round_number: int | None = None, detail: str | None = None, failure_class: str | None = None) -> AgentStatusEvent | None:
        return self.transition(AgentStatus.FAILED, round_number=round_number, detail=detail, failure_class=failure_class)

    def mark_timed_out(self, round_number: int) -> AgentStatusEvent | None:
        return self.transition(AgentStatus.TIMED_OUT, round_number=round_number, detail="Agent timed out")

    def mark_cancelled(self) -> AgentStatusEvent | None:
        return self.transition(AgentStatus.CANCELLED)

    def retry_from_failure(self) -> AgentStatusEvent | None:
        if self._status in (AgentStatus.FAILED, AgentStatus.TIMED_OUT):
            return self.transition(AgentStatus.READY)
        return None

    def get_attempt_count(self, round_number: int) -> int:
        return self._round_attempts.get(round_number, 0)

    def to_dict(self) -> dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "status": self._status.value,
            "created_at": self._created_at,
            "event_count": len(self._events),
            "round_attempts": dict(self._round_attempts),
        }


class AgentLifecycleRegistry:

    def __init__(self):
        self._agents: dict[str, AgentLifecycle] = {}

    def register(self, agent_id: str) -> AgentLifecycle:
        lifecycle = AgentLifecycle(agent_id)
        self._agents[agent_id] = lifecycle
        return lifecycle

    def get(self, agent_id: str) -> AgentLifecycle | None:
        return self._agents.get(agent_id)

    def all_agents(self) -> dict[str, AgentLifecycle]:
        return dict(self._agents)

    def all_ready(self) -> bool:
        return all(a.status == AgentStatus.READY for a in self._agents.values())

    def all_terminal(self) -> bool:
        return all(a.is_terminal for a in self._agents.values())

    def summary(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for agent in self._agents.values():
            status = agent.status.value
            counts[status] = counts.get(status, 0) + 1
        return counts

    def cancel_all(self) -> None:
        for agent in self._agents.values():
            if not agent.is_terminal:
                agent.mark_cancelled()

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class DebateEventName(Enum):
    DEBATE_START = "debate_start"
    DEBATE_CANCELLED = "debate_cancelled"

    ROUND_START = "round_start"
    ROUND_COMPLETE = "round_complete"

    AGENT_START = "agent_start"
    AGENT_CHUNK = "agent_chunk"
    AGENT_COMPLETE = "agent_complete"

    CONVERGENCE_DETECTED = "convergence_detected"

    JUDGE_START = "judge_start"
    JUDGE_RETRY = "judge_retry"

    CONSENSUS = "consensus"
    COST_UPDATE = "cost_update"
    DONE = "done"
    ERROR = "error"

    ANTI_CAPITULATION = "anti_capitulation"
    ANTI_CAPITULATION_REVISED = "anti_capitulation_revised"

    SUBAGENT_RESEARCH_START = "subagent_research_start"
    SUBAGENT_RESEARCH_DONE = "subagent_research_done"

    SESSION_COMPACTED = "session_compacted"
    RECOVERY_ATTEMPTED = "recovery_attempted"
    FAILURE_CLASSIFIED = "failure_classified"

    ROUTING_APPLIED = "routing:applied"
    ROUTING_FALLBACK = "routing:fallback"

    TOOL_CALL_START = "tool:call_start"
    TOOL_CALL_RESULT = "tool:call_result"
    TOOL_LOOP_START = "tool:loop_start"
    TOOL_LOOP_DONE = "tool:loop_done"
    GOVERNANCE_POLICY_CHECK = "governance:policy_check"
    GOVERNANCE_APPROVAL_REQUESTED = "governance:approval_requested"
    GOVERNANCE_DECISION = "governance:decision"
    RISK_SCORING_START = "risk:scoring_start"
    RISK_SCORING_COMPLETE = "risk:scoring_complete"
    AUDIT_EXPORTED = "audit:exported"


class DebateEventStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class DebateEvent:
    event: DebateEventName
    data: dict[str, Any] = field(default_factory=dict)
    status: DebateEventStatus | None = None
    event_id: int | None = None

    def to_dict(self) -> dict[str, Any]:
        result = {"event": self.event.value, **self.data}
        if self.status:
            result["status"] = self.status.value
        if self.event_id is not None:
            result["_event_id"] = self.event_id
        return result

    @classmethod
    def debate_start(cls, debate_id: str, topic: str, models: list[str], **kwargs) -> DebateEvent:
        return cls(
            event=DebateEventName.DEBATE_START,
            data={"debate_id": debate_id, "topic": topic, "models": models, **kwargs},
            status=DebateEventStatus.PROCESSING,
        )

    @classmethod
    def round_start(cls, round_number: int, description: str) -> DebateEvent:
        return cls(
            event=DebateEventName.ROUND_START,
            data={"round": round_number, "description": description},
        )

    @classmethod
    def agent_start(cls, agent_id: str, round_number: int) -> DebateEvent:
        return cls(
            event=DebateEventName.AGENT_START,
            data={"agent_id": agent_id, "round": round_number},
        )

    @classmethod
    def agent_complete(cls, agent_id: str, round_number: int, content: str) -> DebateEvent:
        return cls(
            event=DebateEventName.AGENT_COMPLETE,
            data={"agent_id": agent_id, "round": round_number, "content": content[:200]},
        )

    @classmethod
    def done(cls, debate_id: str, status: str = "completed", **kwargs) -> DebateEvent:
        return cls(
            event=DebateEventName.DONE,
            data={"status": status, "debate_id": debate_id, **kwargs},
            status=DebateEventStatus.COMPLETED if status == "completed" else DebateEventStatus.CANCELLED,
        )

    @classmethod
    def error(cls, message: str, recoverable: bool = False) -> DebateEvent:
        return cls(
            event=DebateEventName.ERROR,
            data={"message": message, "recoverable": recoverable},
            status=DebateEventStatus.FAILED,
        )

    @classmethod
    def failure_classified(cls, failure_class: str, provider: str | None, detail: str, recoverable: bool) -> DebateEvent:
        return cls(
            event=DebateEventName.FAILURE_CLASSIFIED,
            data={
                "failure_class": failure_class,
                "provider": provider,
                "detail": detail,
                "recoverable": recoverable,
            },
        )

    @classmethod
    def recovery_attempted(cls, failure_class: str, provider: str | None, success: bool) -> DebateEvent:
        return cls(
            event=DebateEventName.RECOVERY_ATTEMPTED,
            data={
                "failure_class": failure_class,
                "provider": provider,
                "success": success,
            },
        )

    @classmethod
    def session_compacted(cls, original_tokens: int, compacted_tokens: int) -> DebateEvent:
        return cls(
            event=DebateEventName.SESSION_COMPACTED,
            data={
                "original_tokens": original_tokens,
                "compacted_tokens": compacted_tokens,
                "reduction_pct": round((1 - compacted_tokens / original_tokens) * 100, 1) if original_tokens > 0 else 0,
            },
        )


VALID_EVENT_NAMES = frozenset(e.value for e in DebateEventName)

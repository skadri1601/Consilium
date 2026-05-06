from __future__ import annotations

import copy
import hashlib
import logging
import time
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


def _generate_fork_id(parent_id: str, fork_point: int) -> str:
    seed = f"{parent_id}:{fork_point}:{time.time()}"
    return hashlib.sha256(seed.encode()).hexdigest()[:16]


@dataclass
class SessionFork:
    fork_id: str
    parent_debate_id: str
    fork_round: int
    fork_reason: str | None = None
    created_at: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        return {
            "fork_id": self.fork_id,
            "parent_debate_id": self.parent_debate_id,
            "fork_round": self.fork_round,
            "fork_reason": self.fork_reason,
            "created_at": self.created_at,
        }


@dataclass
class DebateSnapshot:
    debate_id: str
    topic: str
    model_ids: list[str]
    all_responses: dict[int, dict[str, str]]
    round_count: int
    system_prompt: str | None = None
    sub_agents: bool = False
    project_context: dict | None = None
    cost_so_far: float = 0.0
    fork: SessionFork | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "debate_id": self.debate_id,
            "topic": self.topic[:200],
            "model_ids": self.model_ids,
            "rounds_completed": sorted(self.all_responses.keys()),
            "round_count": self.round_count,
            "cost_so_far": self.cost_so_far,
            "fork": self.fork.to_dict() if self.fork else None,
        }


class SessionForkManager:

    def __init__(self):
        self._forks: dict[str, SessionFork] = {}
        self._snapshots: dict[str, DebateSnapshot] = {}

    def create_fork(
        self,
        parent_debate_id: str,
        fork_round: int,
        snapshot: DebateSnapshot,
        reason: str | None = None,
    ) -> tuple[str, DebateSnapshot]:
        fork_id = _generate_fork_id(parent_debate_id, fork_round)
        fork_debate_id = f"{parent_debate_id}:fork:{fork_id}"

        fork_meta = SessionFork(
            fork_id=fork_id,
            parent_debate_id=parent_debate_id,
            fork_round=fork_round,
            fork_reason=reason,
        )
        self._forks[fork_id] = fork_meta

        forked_responses = {}
        for round_num, responses in snapshot.all_responses.items():
            if round_num <= fork_round:
                forked_responses[round_num] = copy.deepcopy(responses)

        forked_snapshot = DebateSnapshot(
            debate_id=fork_debate_id,
            topic=snapshot.topic,
            model_ids=list(snapshot.model_ids),
            all_responses=forked_responses,
            round_count=snapshot.round_count,
            system_prompt=snapshot.system_prompt,
            sub_agents=snapshot.sub_agents,
            project_context=copy.deepcopy(snapshot.project_context) if snapshot.project_context else None,
            cost_so_far=snapshot.cost_so_far,
            fork=fork_meta,
        )
        self._snapshots[fork_debate_id] = forked_snapshot

        logger.info(
            "Created fork %s from debate %s at round %d",
            fork_id, parent_debate_id, fork_round,
        )

        return fork_debate_id, forked_snapshot

    def get_fork(self, fork_id: str) -> SessionFork | None:
        return self._forks.get(fork_id)

    def get_snapshot(self, debate_id: str) -> DebateSnapshot | None:
        return self._snapshots.get(debate_id)

    def list_forks(self, parent_debate_id: str) -> list[SessionFork]:
        return [
            f for f in self._forks.values()
            if f.parent_debate_id == parent_debate_id
        ]

    def get_lineage(self, debate_id: str) -> list[str]:
        lineage = [debate_id]
        snapshot = self._snapshots.get(debate_id)
        while snapshot and snapshot.fork:
            parent = snapshot.fork.parent_debate_id
            lineage.append(parent)
            snapshot = self._snapshots.get(parent)
        lineage.reverse()
        return lineage

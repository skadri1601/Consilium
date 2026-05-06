from __future__ import annotations

import time
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)

_task_counter = 0


def _next_task_id() -> str:
    global _task_counter
    _task_counter += 1
    ts = int(time.time() * 1000)
    return f"task_{ts:x}_{_task_counter}"


class TaskStatus(Enum):
    CREATED = "created"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class TaskMessage:
    role: str
    content: str
    timestamp: float = field(default_factory=time.time)


@dataclass
class DebateTask:
    task_id: str
    agent_id: str
    round_number: int
    prompt_hash: str
    status: TaskStatus = TaskStatus.CREATED
    messages: list[TaskMessage] = field(default_factory=list)
    output: str | None = None
    cost: float = 0.0
    tokens_used: int = 0
    created_at: float = field(default_factory=time.time)
    started_at: float | None = None
    completed_at: float | None = None
    error: str | None = None
    attempt: int = 1

    def start(self) -> None:
        self.status = TaskStatus.RUNNING
        self.started_at = time.time()

    def complete(self, output: str, cost: float = 0.0, tokens: int = 0) -> None:
        self.status = TaskStatus.COMPLETED
        self.output = output
        self.cost = cost
        self.tokens_used = tokens
        self.completed_at = time.time()

    def fail(self, error: str) -> None:
        self.status = TaskStatus.FAILED
        self.error = error
        self.completed_at = time.time()

    def cancel(self) -> None:
        self.status = TaskStatus.CANCELLED
        self.completed_at = time.time()

    def add_message(self, role: str, content: str) -> None:
        self.messages.append(TaskMessage(role=role, content=content))

    @property
    def duration_ms(self) -> int | None:
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at) * 1000)
        return None

    def to_dict(self) -> dict[str, Any]:
        return {
            "task_id": self.task_id,
            "agent_id": self.agent_id,
            "round": self.round_number,
            "status": self.status.value,
            "cost": self.cost,
            "tokens": self.tokens_used,
            "duration_ms": self.duration_ms,
            "attempt": self.attempt,
            "error": self.error,
            "message_count": len(self.messages),
        }


class DebateTaskRegistry:

    def __init__(self, debate_id: str):
        self.debate_id = debate_id
        self._tasks: dict[str, DebateTask] = {}
        self._by_agent_round: dict[str, DebateTask] = {}

    def create_task(self, agent_id: str, round_number: int, prompt_hash: str, attempt: int = 1) -> DebateTask:
        task_id = _next_task_id()
        task = DebateTask(
            task_id=task_id,
            agent_id=agent_id,
            round_number=round_number,
            prompt_hash=prompt_hash,
            attempt=attempt,
        )
        self._tasks[task_id] = task
        self._by_agent_round[f"{agent_id}:{round_number}"] = task
        return task

    def get_task(self, task_id: str) -> DebateTask | None:
        return self._tasks.get(task_id)

    def get_by_agent_round(self, agent_id: str, round_number: int) -> DebateTask | None:
        return self._by_agent_round.get(f"{agent_id}:{round_number}")

    def get_round_tasks(self, round_number: int) -> list[DebateTask]:
        return [t for t in self._tasks.values() if t.round_number == round_number]

    def cancel_all_running(self) -> int:
        count = 0
        for task in self._tasks.values():
            if task.status in (TaskStatus.CREATED, TaskStatus.RUNNING):
                task.cancel()
                count += 1
        return count

    @property
    def total_cost(self) -> float:
        return sum(t.cost for t in self._tasks.values())

    @property
    def total_tokens(self) -> int:
        return sum(t.tokens_used for t in self._tasks.values())

    def round_summary(self, round_number: int) -> dict[str, Any]:
        tasks = self.get_round_tasks(round_number)
        completed = [t for t in tasks if t.status == TaskStatus.COMPLETED]
        failed = [t for t in tasks if t.status == TaskStatus.FAILED]
        return {
            "round": round_number,
            "total": len(tasks),
            "completed": len(completed),
            "failed": len(failed),
            "total_cost": sum(t.cost for t in tasks),
            "avg_duration_ms": (
                sum(t.duration_ms or 0 for t in completed) // len(completed)
                if completed else 0
            ),
        }

    def full_summary(self) -> dict[str, Any]:
        rounds = sorted(set(t.round_number for t in self._tasks.values()))
        return {
            "debate_id": self.debate_id,
            "total_tasks": len(self._tasks),
            "total_cost": self.total_cost,
            "total_tokens": self.total_tokens,
            "rounds": {r: self.round_summary(r) for r in rounds},
        }

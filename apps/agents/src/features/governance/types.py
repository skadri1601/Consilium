from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class PolicyAction(str, Enum):
    APPROVE = "approve"
    BLOCK = "block"
    ESCALATE_HUMAN = "escalate_human"
    ESCALATE_QUORUM = "escalate_quorum"


@dataclass
class PolicyRule:
    id: str
    name: str
    conditions: dict
    action: PolicyAction
    priority: int = 0


@dataclass
class PolicyDecision:
    allowed: bool
    action: PolicyAction
    matching_rule: PolicyRule | None
    reason: str


@dataclass
class QuorumConfig:
    min_votes: int
    required_majority: float = 0.6
    models: list[str] = field(default_factory=list)
    timeout_seconds: int = 30

    def __post_init__(self) -> None:
        if not isinstance(self.min_votes, int) or self.min_votes < 0:
            raise ValueError(f"min_votes must be a non-negative integer, got {self.min_votes!r}")
        if not 0.0 <= self.required_majority <= 1.0:
            raise ValueError(
                f"required_majority must be in [0, 1], got {self.required_majority!r}"
            )


@dataclass
class QuorumVote:
    model_id: str
    approved: bool
    confidence: float
    reasoning: str

    def __post_init__(self) -> None:
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(
                f"confidence must be in [0, 1], got {self.confidence!r}"
            )


@dataclass
class QuorumResult:
    approved: bool
    votes: list[QuorumVote]
    approval_ratio: float
    confidence: float

    def __post_init__(self) -> None:
        if not 0.0 <= self.approval_ratio <= 1.0:
            raise ValueError(
                f"approval_ratio must be in [0, 1], got {self.approval_ratio!r}"
            )
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(
                f"confidence must be in [0, 1], got {self.confidence!r}"
            )


@dataclass
class BudgetLimit:
    agent_id: str
    daily_limit: float
    monthly_limit: float = 0

    def __post_init__(self) -> None:
        if self.daily_limit < 0:
            raise ValueError(
                f"daily_limit must be >= 0 for agent_id={self.agent_id!r}, "
                f"got {self.daily_limit!r}"
            )
        if self.monthly_limit < 0:
            raise ValueError(
                f"monthly_limit must be >= 0 for agent_id={self.agent_id!r}, "
                f"got {self.monthly_limit!r}"
            )


@dataclass
class DelegationScope:
    allowed_actions: list[str] = field(default_factory=list)
    max_cost: float = 0
    expires_at: str | None = None

    def __post_init__(self) -> None:
        if self.max_cost < 0:
            raise ValueError(f"max_cost must be >= 0, got {self.max_cost!r}")

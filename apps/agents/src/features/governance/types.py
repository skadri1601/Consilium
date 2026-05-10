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


@dataclass
class QuorumVote:
    model_id: str
    approved: bool
    confidence: float
    reasoning: str


@dataclass
class QuorumResult:
    approved: bool
    votes: list[QuorumVote]
    approval_ratio: float
    confidence: float


@dataclass
class BudgetLimit:
    agent_id: str
    daily_limit: float
    monthly_limit: float = 0


@dataclass
class DelegationScope:
    allowed_actions: list[str] = field(default_factory=list)
    max_cost: float = 0
    expires_at: str | None = None

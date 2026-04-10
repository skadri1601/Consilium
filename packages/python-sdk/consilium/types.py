from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class DeliberationMode(str, Enum):
    COUNCIL = "council"
    RED_TEAM = "red-team"
    BLIND_EVAL = "blind-eval"
    PREDICTION_MARKET = "prediction-market"
    ADVERSARIAL = "adversarial"
    DELPHI = "delphi"


class CostBreakdownEntry(BaseModel):
    model: str = ""
    role: str = ""
    estimated_cost: float = Field(0.0, alias="estimatedCost")

    model_config = {"populate_by_name": True}


class CostEstimate(BaseModel):
    estimated_cost: float = Field(0.0, alias="estimatedCost")
    breakdown: list[CostBreakdownEntry] = Field(default_factory=list)
    rounds: int = 0
    mode: str = ""

    model_config = {"populate_by_name": True}


class Vote(BaseModel):
    model: str = ""
    position: str = ""
    confidence: float = 0.0


class RoundEntry(BaseModel):
    round: int = 0
    model: str = ""
    role: str = ""
    content: str = ""


class DeliberationResult(BaseModel):
    golden_prompt: str = Field("", alias="goldenPrompt")
    dissent_report: str = Field("", alias="dissentReport")
    cost: float = 0.0
    audit_trail: list[dict[str, Any]] = Field(default_factory=list, alias="auditTrail")
    votes: dict[str, Any] = Field(default_factory=dict)
    confidence_scores: dict[str, float] = Field(default_factory=dict, alias="confidenceScores")

    model_config = {"populate_by_name": True}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> DeliberationResult:
        return cls(
            golden_prompt=data.get("golden_prompt", data.get("goldenPrompt", "")),
            dissent_report=data.get("dissent_report", data.get("dissentReport", "")),
            cost=data.get("cost", 0.0),
            audit_trail=data.get("audit_trail", data.get("auditTrail", [])),
            votes=data.get("votes", {}),
            confidence_scores=data.get("confidence_scores", data.get("confidenceScores", {})),
        )


class AttackResult(BaseModel):
    category: str = ""
    prompt: str = ""
    success: bool = False
    severity: str = ""


class DefenseResult(BaseModel):
    category: str = ""
    blocked: bool = False
    method: str = ""


class JudgmentResult(BaseModel):
    category: str = ""
    score: float = 0.0
    reasoning: str = ""


class RedTeamResult(BaseModel):
    attacks: list[dict[str, Any]] = Field(default_factory=list)
    defenses: list[dict[str, Any]] = Field(default_factory=list)
    judgments: list[dict[str, Any]] = Field(default_factory=list)
    overall_score: float = Field(0.0, alias="overallScore")
    vulnerability_count: int = Field(0, alias="vulnerabilityCount")

    model_config = {"populate_by_name": True}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RedTeamResult:
        return cls(
            attacks=data.get("attacks", []),
            defenses=data.get("defenses", []),
            judgments=data.get("judgments", []),
            overall_score=data.get("overall_score", data.get("overallScore", 0.0)),
            vulnerability_count=data.get("vulnerability_count", data.get("vulnerabilityCount", 0)),
        )


class EvalResult(BaseModel):
    rankings: list[dict[str, Any]] = Field(default_factory=list)
    scores: dict[str, float] = Field(default_factory=dict)
    method: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> EvalResult:
        return cls(
            rankings=data.get("rankings", []),
            scores=data.get("scores", {}),
            method=data.get("method", ""),
        )


class HealthStatus(BaseModel):
    status: str = ""
    info: dict[str, Any] | None = None

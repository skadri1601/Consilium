from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from src.features.risk.scorer import RiskAssessment
from src.features.risk.monitor import ContinuousRiskMonitor, RiskProfile

router = APIRouter(prefix="/risk", tags=["risk"])
_monitor = ContinuousRiskMonitor()


class ScoreRequest(BaseModel):
    proposal: str
    context: str | None = None


class ScoreResponse(BaseModel):
    risk_score: int
    severity: str
    vulnerabilities: list[dict]
    mitigations: list[str]
    confidence: float
    models_used: list[str]
    duration_ms: int


class ProfileResponse(BaseModel):
    agent_id: str
    avg_score: float
    trend: str
    score_count: int
    alert_count: int


@router.post("/score", response_model=ScoreResponse)
async def score_proposal(body: ScoreRequest) -> ScoreResponse:
    stub = RiskAssessment(
        risk_score=0,
        severity="low",
        vulnerabilities=[],
        mitigations=[],
        confidence=1.0,
        models_used=["stub"],
        duration_ms=0,
    )
    return ScoreResponse(
        risk_score=stub.risk_score,
        severity=stub.severity,
        vulnerabilities=stub.vulnerabilities,
        mitigations=stub.mitigations,
        confidence=stub.confidence,
        models_used=stub.models_used,
        duration_ms=stub.duration_ms,
    )


@router.get("/agent/{agent_id}/profile", response_model=ProfileResponse)
async def get_agent_profile(agent_id: str) -> ProfileResponse:
    profile = _monitor.get_profile(agent_id)
    return ProfileResponse(
        agent_id=profile.agent_id,
        avg_score=profile.avg_score,
        trend=profile.trend,
        score_count=profile.score_count,
        alert_count=profile.alert_count,
    )

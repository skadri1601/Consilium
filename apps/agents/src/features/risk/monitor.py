from __future__ import annotations

import math
from collections.abc import Sequence
from dataclasses import dataclass

from src.features.risk.scorer import RiskAssessment

_DRIFT_EPSILON = 1e-9


@dataclass
class RiskProfile:
    agent_id: str
    avg_score: float = 0.0
    trend: str = "stable"
    score_count: int = 0
    last_score: RiskAssessment | None = None
    alert_count: int = 0


class ContinuousRiskMonitor:
    def __init__(self, alert_threshold: int = 75) -> None:
        self._alert_threshold = alert_threshold
        self._history: dict[str, list[RiskAssessment]] = {}

    def record_score(self, agent_id: str, assessment: RiskAssessment) -> None:
        if agent_id not in self._history:
            self._history[agent_id] = []
        self._history[agent_id].append(assessment)

    def get_profile(self, agent_id: str) -> RiskProfile:
        scores = self._history.get(agent_id, [])
        if not scores:
            return RiskProfile(agent_id=agent_id)

        risk_values = [s.risk_score for s in scores]
        avg = sum(risk_values) / len(risk_values)
        alert_count = sum(1 for v in risk_values if v > self._alert_threshold)
        trend = self._compute_trend(risk_values)

        return RiskProfile(
            agent_id=agent_id,
            avg_score=avg,
            trend=trend,
            score_count=len(scores),
            last_score=scores[-1],
            alert_count=alert_count,
        )

    def check_drift(self, agent_id: str, window: int = 5) -> bool:
        scores = self._history.get(agent_id, [])
        if len(scores) < window:
            return False

        risk_values = [s.risk_score for s in scores]
        overall_avg = sum(risk_values) / len(risk_values)
        if math.isclose(overall_avg, 0.0, abs_tol=_DRIFT_EPSILON):
            return False

        recent = risk_values[-window:]
        recent_avg = sum(recent) / len(recent)
        diff = abs(recent_avg - overall_avg) / overall_avg
        return diff > 0.20

    @staticmethod
    def _compute_trend(values: Sequence[float]) -> str:
        if len(values) < 3:
            return "stable"
        first_half = values[: len(values) // 2]
        second_half = values[len(values) // 2 :]
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        diff = second_avg - first_avg
        if diff < -5:
            return "improving"
        if diff > 5:
            return "declining"
        return "stable"

from __future__ import annotations

import asyncio
import logging
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

_SEVERITY_WEIGHTS = {"low": 10, "medium": 50, "high": 75, "critical": 100}
_NO_ISSUE_INDICATORS = ["no issues", "no vulnerabilities", "looks good", "no problems"]


@dataclass
class RiskAssessment:
    risk_score: int
    severity: str
    vulnerabilities: list[dict]
    mitigations: list[str]
    confidence: float
    models_used: list[str]
    duration_ms: int


def _classify_severity(risk_score: int) -> str:
    if risk_score <= 25:
        return "low"
    if risk_score <= 50:
        return "medium"
    if risk_score <= 75:
        return "high"
    return "critical"


def _compute_risk_score(vulnerabilities: list[dict]) -> int:
    if not vulnerabilities:
        return 0
    severities = [v.get("severity", "low") for v in vulnerabilities]
    if "critical" in severities:
        return 100
    if "high" in severities:
        return 75
    significant = sum(1 for s in severities if s in ("medium", "high", "critical"))
    if "medium" in severities or significant >= 3:
        return 50
    return 25


def _parse_vulnerabilities(attack_text: str) -> list[dict]:
    vulns: list[dict] = []
    lines = attack_text.strip().split("\n")
    for line in lines:
        line = line.strip()
        if not line:
            continue
        upper = line.upper()
        if "CRITICAL" in upper:
            sev = "critical"
        elif "HIGH" in upper:
            sev = "high"
        elif "MEDIUM" in upper:
            sev = "medium"
        elif "LOW" in upper:
            sev = "low"
        else:
            sev = "medium"
            logger.debug("_parse_vulnerabilities: defaulting to 'medium' for line=%r", line)
        category = "general"
        for cat in ["sql injection", "xss", "security", "logic", "edge case", "bias", "injection"]:
            if cat in line.lower():
                category = cat
                break
        vulns.append({"category": category, "description": line, "severity": sev})
    return vulns


def _parse_mitigations(defense_text: str) -> list[str]:
    mitigations: list[str] = []
    lines = defense_text.strip().split("\n")
    for line in lines:
        line = line.strip()
        if line:
            mitigations.append(line)
    return mitigations


class RiskScorer:
    def __init__(self, create_agent_fn: Callable[..., Any] | None = None) -> None:
        self._create_agent_fn = create_agent_fn

    async def score(self, proposal: str, context: str | None = None) -> RiskAssessment:
        start = time.monotonic()
        models_used: list[str] = []

        try:
            attacker = await self._create_agent("attacker")
            defender = await self._create_agent("defender")
            judge = await self._create_agent("judge")
        except Exception as exc:
            logger.exception("RiskScorer: failed to create agents: %s", exc)
            return self._partial_result(start, models_used, "agent factory failed")

        prompt_context = f"\nContext: {context}" if context else ""
        attack_text = ""
        defense_text = ""
        judge_text = ""

        try:
            attack_response = await attacker.run(
                f"Find vulnerabilities in this proposal:{prompt_context}\n\n{proposal}"
            )
            attack_text = self._extract_text(attack_response)
            models_used.append("attacker")
        except Exception as exc:
            logger.exception("RiskScorer: attacker.run failed: %s", exc)
            return self._partial_result(start, models_used, f"attacker failed: {exc}")

        if any(ind in attack_text.lower() for ind in _NO_ISSUE_INDICATORS):
            elapsed_ms = int((time.monotonic() - start) * 1000)
            return RiskAssessment(
                risk_score=0,
                severity="low",
                vulnerabilities=[],
                mitigations=[],
                confidence=0.9,
                models_used=models_used,
                duration_ms=elapsed_ms,
            )

        try:
            defense_response = await defender.run(
                f"Propose mitigations for these findings:\n\n{attack_text}"
            )
            defense_text = self._extract_text(defense_response)
            models_used.append("defender")
        except Exception as exc:
            logger.exception("RiskScorer: defender.run failed: %s", exc)

        try:
            judge_response = await judge.run(
                f"Evaluate severity of:\nAttack:\n{attack_text}\nDefense:\n{defense_text}"
            )
            judge_text = self._extract_text(judge_response)
            models_used.append("judge")
        except Exception as exc:
            logger.exception("RiskScorer: judge.run failed: %s", exc)

        vulnerabilities = _parse_vulnerabilities(attack_text)
        if not vulnerabilities and judge_text:
            vulnerabilities = _parse_vulnerabilities(judge_text)

        mitigations = _parse_mitigations(defense_text)
        risk_score = _compute_risk_score(vulnerabilities)
        severity = _classify_severity(risk_score)

        elapsed_ms = int((time.monotonic() - start) * 1000)

        return RiskAssessment(
            risk_score=risk_score,
            severity=severity,
            vulnerabilities=vulnerabilities,
            mitigations=mitigations,
            confidence=0.8 if vulnerabilities else 0.9,
            models_used=models_used,
            duration_ms=elapsed_ms,
        )

    def _partial_result(self, start: float, models_used: list[str], reason: str) -> RiskAssessment:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return RiskAssessment(
            risk_score=0,
            severity="low",
            vulnerabilities=[{"category": "scorer_error", "description": reason, "severity": "low"}],
            mitigations=[],
            confidence=0.0,
            models_used=models_used,
            duration_ms=elapsed_ms,
        )

    async def _create_agent(self, role: str) -> Any:
        if not self._create_agent_fn:
            raise RuntimeError("No agent factory configured")
        result = self._create_agent_fn(role)
        if asyncio.iscoroutine(result):
            return await result
        return result

    @staticmethod
    def _extract_text(response: Any) -> str:
        if isinstance(response, str):
            return response
        if hasattr(response, "content"):
            return str(response.content)
        if hasattr(response, "text"):
            return str(response.text)
        return str(response)

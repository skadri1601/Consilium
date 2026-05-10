from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable


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
    if "medium" in severities or len(vulnerabilities) >= 3:
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
            continue
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

        attacker = await self._create_agent("attacker")
        defender = await self._create_agent("defender")
        judge = await self._create_agent("judge")

        prompt_context = f"\nContext: {context}" if context else ""
        attack_prompt = f"Find vulnerabilities in this proposal:{prompt_context}\n\n{proposal}"
        attack_response = await attacker.run(attack_prompt)
        attack_text = self._extract_text(attack_response)
        models_used.append("attacker")

        defense_prompt = f"Propose mitigations for these findings:\n\n{attack_text}"
        defense_response = await defender.run(defense_prompt)
        defense_text = self._extract_text(defense_response)
        models_used.append("defender")

        judge_prompt = f"Evaluate severity of:\nAttack:\n{attack_text}\nDefense:\n{defense_text}"
        judge_response = await judge.run(judge_prompt)
        judge_text = self._extract_text(judge_response)
        models_used.append("judge")

        vulnerabilities = _parse_vulnerabilities(attack_text)
        if not vulnerabilities:
            vulnerabilities = _parse_vulnerabilities(judge_text)

        mitigations = _parse_mitigations(defense_text)
        risk_score = _compute_risk_score(vulnerabilities)
        severity = _classify_severity(risk_score)

        no_issue_indicators = ["no issues", "no vulnerabilities", "looks good", "no problems"]
        if any(ind in attack_text.lower() for ind in no_issue_indicators) and not vulnerabilities:
            risk_score = 0
            severity = "low"

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

    async def _create_agent(self, role: str) -> Any:
        if self._create_agent_fn:
            return self._create_agent_fn(role)
        raise RuntimeError("No agent factory configured")

    @staticmethod
    def _extract_text(response: Any) -> str:
        if isinstance(response, str):
            return response
        if hasattr(response, "content"):
            return str(response.content)
        if hasattr(response, "text"):
            return str(response.text)
        return str(response)

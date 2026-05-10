from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from typing import Any

logger = logging.getLogger(__name__)

CONFIDENCE_BASELINE = 0.5
CONFIDENCE_LONG_PROMPT = 0.9
CONFIDENCE_MULTI_ROUND = 0.8
CONFIDENCE_DEFAULT = 0.7
LONG_PROMPT_CHAR_THRESHOLD = 500
MULTI_ROUND_THRESHOLD = 2


@dataclass
class RoundAudit:
    round_number: int
    description: str
    positions: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class AuditDocument:
    debate_id: str
    timestamp: str
    topic: str
    mode: str
    models_used: list[dict[str, str]]
    rounds: list[RoundAudit]
    tool_calls: list[dict[str, Any]]
    judge_reasoning: str
    final_decision: str
    dissent_points: list[str]
    confidence_score: float
    cost_breakdown: dict[str, float]
    duration_ms: int
    version: str = "1.0"

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2, default=str)


class AuditTrailExporter:
    DISSENT_KEYWORDS = ["disagree", "however", "alternative", "dissent", "minority"]

    def export(self, debate_data: dict[str, Any]) -> AuditDocument:
        all_responses: dict[int, dict[str, str]] = debate_data.get("all_responses", {})
        golden_prompt: str = debate_data.get("golden_prompt", "")
        costs: dict = debate_data.get("costs", {})
        models_list: list[str] = debate_data.get("models", [])

        rounds = self._build_rounds(all_responses, costs)

        all_model_ids: set[str] = set(models_list)
        for round_responses in all_responses.values():
            all_model_ids.update(round_responses.keys())
        models_used = [{"model_id": m, "provider": "unknown"} for m in sorted(all_model_ids)]

        dissent_points = self._extract_dissent(golden_prompt)
        confidence_score = self._compute_confidence(all_responses, golden_prompt)
        final_decision = golden_prompt[:1000] if golden_prompt else ""

        judge_model = debate_data.get("judge_model", "")
        judge_reasoning = f"Synthesized by judge {judge_model}".strip()

        return AuditDocument(
            debate_id=debate_data.get("debate_id", ""),
            timestamp=datetime.now(UTC).isoformat(),
            topic=debate_data.get("topic", ""),
            mode=debate_data.get("mode", ""),
            models_used=models_used,
            rounds=rounds,
            tool_calls=debate_data.get("tool_calls", []),
            judge_reasoning=judge_reasoning,
            final_decision=final_decision,
            dissent_points=dissent_points,
            confidence_score=confidence_score,
            cost_breakdown=self._safe_cost_breakdown(costs),
            duration_ms=debate_data.get("duration_ms", 0),
        )

    def _build_rounds(
        self, all_responses: dict[int, dict[str, str]], costs: dict
    ) -> list[RoundAudit]:
        rounds: list[RoundAudit] = []
        for round_num in sorted(all_responses.keys()):
            positions = []
            for model_id, response_text in all_responses[round_num].items():
                word_count = len(response_text.split())
                estimated_tokens = int(word_count * 1.3)
                positions.append({
                    "model": model_id,
                    "content_preview": response_text[:200],
                    "tokens": estimated_tokens,
                    "cost": costs.get(model_id, 0.0),
                })
            rounds.append(RoundAudit(
                round_number=round_num,
                description=f"Round {round_num}",
                positions=positions,
            ))
        return rounds

    def _extract_dissent(self, text: str) -> list[str]:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [
            s.strip()
            for s in sentences
            if any(kw in s.lower() for kw in self.DISSENT_KEYWORDS)
        ]

    @staticmethod
    def _safe_cost_breakdown(costs: dict) -> dict[str, float]:
        """Coerce costs to floats, substituting 0.0 for non-numeric values.

        Logs each problematic key/value pair so the audit export never
        propagates a ValueError/TypeError out of the export path.
        """
        result: dict[str, float] = {}
        for key, value in costs.items():
            try:
                result[key] = float(value)
            except (ValueError, TypeError) as exc:
                logger.warning(
                    "audit_trail: invalid cost for key=%r value=%r (%s); using 0.0",
                    key,
                    value,
                    exc,
                )
                result[key] = 0.0
        return result

    @staticmethod
    def _compute_confidence(
        all_responses: dict[int, dict[str, str]], golden_prompt: str
    ) -> float:
        """Heuristic confidence score in [0, 1].

        Rule order (long prompt rule runs *before* the empty-rounds short
        circuit so a substantial golden_prompt can lift confidence even
        when round data is missing):

        1. ``len(golden_prompt) > LONG_PROMPT_CHAR_THRESHOLD`` -> ``CONFIDENCE_LONG_PROMPT``
           (a fully-formed synthesis is the strongest single signal).
        2. ``num_rounds == 0`` -> ``CONFIDENCE_BASELINE`` (no data at all).
        3. ``num_rounds >= MULTI_ROUND_THRESHOLD`` -> ``CONFIDENCE_MULTI_ROUND``
           (multiple rounds of debate converged).
        4. Otherwise -> ``CONFIDENCE_DEFAULT`` (single round only).
        """
        num_rounds = len(all_responses)
        if len(golden_prompt) > LONG_PROMPT_CHAR_THRESHOLD:
            return CONFIDENCE_LONG_PROMPT
        if num_rounds == 0:
            return CONFIDENCE_BASELINE
        if num_rounds >= MULTI_ROUND_THRESHOLD:
            return CONFIDENCE_MULTI_ROUND
        return CONFIDENCE_DEFAULT

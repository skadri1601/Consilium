from __future__ import annotations

import re
import uuid

from .decision_store import DecisionRecord


class DecisionExtractor:
    DISSENT_KEYWORDS = [
        "disagree",
        "however",
        "alternative",
        "dissent",
        "minority",
        "counterargument",
        "objection",
    ]

    def extract(
        self,
        topic: str,
        golden_prompt: str,
        all_responses: dict[int, dict[str, str]],
        mode: str,
        user_id: str = "",
        debate_id: str = "",
    ) -> DecisionRecord:
        decision = golden_prompt[:1000] if golden_prompt else ""

        sentences = re.split(r"(?<=[.!?])\s+", golden_prompt or "")
        reasoning = " ".join(sentences[:3])

        dissent_points = [
            s.strip()
            for s in sentences
            if any(kw in s.lower() for kw in self.DISSENT_KEYWORDS)
        ]

        models_used = sorted(set(
            model
            for round_responses in all_responses.values()
            for model in round_responses.keys()
        ))

        last_round = max(all_responses.keys()) if all_responses else 0
        last_responses = list(all_responses.get(last_round, {}).values())
        confidence = 0.7
        if len(last_responses) >= 2:
            if len(golden_prompt or "") > 500:
                confidence = 0.85
            if len(golden_prompt or "") > 1000:
                confidence = 0.9

        return DecisionRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            debate_id=debate_id,
            topic=topic[:500],
            decision=decision,
            reasoning=reasoning,
            dissent_points=dissent_points[:5],
            models_used=models_used,
            mode=mode,
            confidence_score=confidence,
        )

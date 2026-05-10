from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

EmbedFn = Callable[[str], Awaitable[list[float]]]


@dataclass
class DecisionRecord:
    id: str
    user_id: str
    debate_id: str
    topic: str
    decision: str
    reasoning: str
    dissent_points: list[str]
    models_used: list[str]
    mode: str
    confidence_score: float
    vertical: str = "general"
    audit_trail_id: str = ""
    tags: list[str] = field(default_factory=list)
    embedding: list[float] | None = None


class DecisionStore:
    def __init__(self) -> None:
        self._records: dict[str, DecisionRecord] = {}

    async def store(self, record: DecisionRecord, embed_fn: EmbedFn) -> None:
        text = f"{record.topic}\n{record.decision}"
        record.embedding = await embed_fn(text)
        self._records[record.id] = record

    async def search(
        self,
        query: str,
        user_id: str,
        embed_fn: EmbedFn,
        limit: int = 5,
        min_similarity: float = 0.7,
    ) -> list[dict[str, Any]]:
        query_embedding = await embed_fn(query)
        results = []
        for record in self._records.values():
            if record.user_id != user_id or record.embedding is None:
                continue
            sim = self._cosine_similarity(query_embedding, record.embedding)
            if sim >= min_similarity:
                results.append({
                    "topic": record.topic,
                    "decision": record.decision,
                    "reasoning": record.reasoning,
                    "dissent_points": record.dissent_points,
                    "mode": record.mode,
                    "similarity": round(sim, 4),
                })
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:limit]

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        if len(a) != len(b) or not a:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

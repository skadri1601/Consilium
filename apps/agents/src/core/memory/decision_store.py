from __future__ import annotations

import asyncio
import logging
import math
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

EmbedFn = Callable[[str], Awaitable[list[float]]]

logger = logging.getLogger(__name__)


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
    """In-memory store of decision records.

    All public methods are coroutine-safe via an internal asyncio lock.
    Persistence is intentionally pluggable: subclass and override
    ``_persist_record`` / ``_load_records`` (or replace the whole class)
    to back the store with Postgres, Redis, etc., without changing
    callers. Records are indexed by user_id internally so per-user
    search is O(records-for-user) rather than O(all records).
    """

    def __init__(self) -> None:
        self._records_by_user: dict[str, dict[str, DecisionRecord]] = {}
        self._lock = asyncio.Lock()

    async def _persist_record(self, record: DecisionRecord) -> None:  # noqa: ARG002 - hook for subclasses
        return None

    async def _load_records(self) -> list[DecisionRecord]:
        return []

    async def store(self, record: DecisionRecord, embed_fn: EmbedFn) -> None:
        text = f"{record.topic}\n{record.decision}"
        try:
            record.embedding = await embed_fn(text)
        except Exception as exc:
            logger.warning(
                "DecisionStore.store: embed_fn failed for record_id=%s: %s",
                record.id,
                exc,
            )
            record.embedding = None

        async with self._lock:
            bucket = self._records_by_user.setdefault(record.user_id, {})
            if record.id in bucket:
                logger.warning(
                    "DecisionStore.store: overwriting existing record id=%s for user_id=%s",
                    record.id,
                    record.user_id,
                )
            bucket[record.id] = record
        await self._persist_record(record)

    async def search(
        self,
        query: str,
        user_id: str,
        embed_fn: EmbedFn,
        limit: int = 5,
        min_similarity: float = 0.7,
    ) -> list[dict[str, Any]]:
        try:
            query_embedding = await embed_fn(query)
        except Exception as exc:
            logger.warning("DecisionStore.search: embed_fn failed for query: %s", exc)
            return []

        async with self._lock:
            bucket = list(self._records_by_user.get(user_id, {}).values())

        results: list[dict[str, Any]] = []
        for record in bucket:
            if record.embedding is None:
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

    async def delete(self, user_id: str, record_id: str) -> bool:
        async with self._lock:
            bucket = self._records_by_user.get(user_id)
            if not bucket or record_id not in bucket:
                return False
            del bucket[record_id]
            if not bucket:
                self._records_by_user.pop(user_id, None)
            return True

    async def list_for_user(self, user_id: str) -> list[DecisionRecord]:
        async with self._lock:
            return list(self._records_by_user.get(user_id, {}).values())

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        if len(a) != len(b) or not a:
            return 0.0
        dot = sum(x * y for x, y in zip(a, b, strict=False))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

from __future__ import annotations

import json
import logging
from typing import Any

from .decision_store import DecisionRecord, DecisionStore, EmbedFn

logger = logging.getLogger(__name__)


class PostgresDecisionStore(DecisionStore):
    def __init__(self, dsn: str) -> None:
        super().__init__()
        self._dsn = dsn
        self._schema_ready = False

    async def _ensure_schema(self, conn: Any) -> None:
        if self._schema_ready:
            return
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS consilium_agent_decisions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                debate_id TEXT NOT NULL,
                topic TEXT NOT NULL DEFAULT '',
                decision TEXT NOT NULL DEFAULT '',
                reasoning TEXT NOT NULL DEFAULT '',
                dissent_points JSONB NOT NULL DEFAULT '[]',
                models_used JSONB NOT NULL DEFAULT '[]',
                mode TEXT NOT NULL DEFAULT '',
                confidence_score DOUBLE PRECISION NOT NULL DEFAULT 0,
                vertical TEXT NOT NULL DEFAULT 'general',
                audit_trail_id TEXT NOT NULL DEFAULT '',
                tags JSONB NOT NULL DEFAULT '[]',
                embedding JSONB
            );
            CREATE INDEX IF NOT EXISTS consilium_agent_decisions_user_id_idx
            ON consilium_agent_decisions (user_id);
            """,
        )
        self._schema_ready = True

    async def _persist_record(self, record: DecisionRecord) -> None:
        import asyncpg

        conn = await asyncpg.connect(self._dsn)
        try:
            await self._ensure_schema(conn)
            embed_json = json.dumps(record.embedding) if record.embedding is not None else None
            await conn.execute(
                """
                INSERT INTO consilium_agent_decisions (
                    id, user_id, debate_id, topic, decision, reasoning,
                    dissent_points, models_used, mode, confidence_score,
                    vertical, audit_trail_id, tags, embedding
                ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12, $13::jsonb, $14::jsonb)
                ON CONFLICT (id) DO UPDATE SET
                    topic = EXCLUDED.topic,
                    decision = EXCLUDED.decision,
                    reasoning = EXCLUDED.reasoning,
                    dissent_points = EXCLUDED.dissent_points,
                    models_used = EXCLUDED.models_used,
                    mode = EXCLUDED.mode,
                    confidence_score = EXCLUDED.confidence_score,
                    vertical = EXCLUDED.vertical,
                    audit_trail_id = EXCLUDED.audit_trail_id,
                    tags = EXCLUDED.tags,
                    embedding = EXCLUDED.embedding;
                """,
                record.id,
                record.user_id,
                record.debate_id,
                record.topic,
                record.decision,
                record.reasoning,
                json.dumps(record.dissent_points),
                json.dumps(record.models_used),
                record.mode,
                record.confidence_score,
                record.vertical,
                record.audit_trail_id,
                json.dumps(record.tags),
                embed_json,
            )
        except Exception as exc:
            logger.warning("PostgresDecisionStore persist failed: %s", exc)
        finally:
            await conn.close()

    async def _hydrate_user(self, user_id: str) -> None:
        import asyncpg

        conn = await asyncpg.connect(self._dsn)
        try:
            await self._ensure_schema(conn)
            rows = await conn.fetch(
                """
                SELECT id, user_id, debate_id, topic, decision, reasoning,
                       dissent_points, models_used, mode, confidence_score,
                       vertical, audit_trail_id, tags, embedding
                FROM consilium_agent_decisions
                WHERE user_id = $1;
                """,
                user_id,
            )
        finally:
            await conn.close()

        bucket: dict[str, DecisionRecord] = {}
        for row in rows:
            emb = row["embedding"]
            embedding: list[float] | None
            if emb is None:
                embedding = None
            else:
                embedding = list(emb) if isinstance(emb, list) else None
            bucket[row["id"]] = DecisionRecord(
                id=row["id"],
                user_id=row["user_id"],
                debate_id=row["debate_id"],
                topic=row["topic"] or "",
                decision=row["decision"] or "",
                reasoning=row["reasoning"] or "",
                dissent_points=list(row["dissent_points"] or []),
                models_used=list(row["models_used"] or []),
                mode=row["mode"] or "",
                confidence_score=float(row["confidence_score"] or 0),
                vertical=row["vertical"] or "general",
                audit_trail_id=row["audit_trail_id"] or "",
                tags=list(row["tags"] or []),
                embedding=embedding,
            )
        async with self._lock:
            self._records_by_user[user_id] = bucket
        logger.debug(
            "PostgresDecisionStore hydrated user_id=%s count=%d",
            user_id,
            len(bucket),
        )

    async def search(
        self,
        query: str,
        user_id: str,
        embed_fn: EmbedFn,
        limit: int = 5,
        min_similarity: float = 0.7,
    ) -> list[dict[str, Any]]:
        if user_id:
            async with self._lock:
                need_hydrate = user_id not in self._records_by_user
            if need_hydrate:
                await self._hydrate_user(user_id)
        return await super().search(query, user_id, embed_fn, limit, min_similarity)

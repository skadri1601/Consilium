from __future__ import annotations

from typing import Any

from .decision_store import DecisionStore, EmbedFn


class MemoryRetriever:
    def __init__(self, store: DecisionStore, max_results: int = 3) -> None:
        self._store = store
        self._max_results = max_results

    async def build_context(self, topic: str, user_id: str, embed_fn: EmbedFn) -> str:
        results = await self._store.search(
            query=topic,
            user_id=user_id,
            embed_fn=embed_fn,
            limit=self._max_results,
        )
        if not results:
            return ""

        lines = ["=== PRIOR DECISIONS (from past deliberations) ==="]
        for r in results:
            sim = r.get("similarity", 0)
            lines.append(f"\n--- Prior Topic (relevance: {sim:.0%}) ---")
            lines.append(f"Topic: {r.get('topic', 'unknown')}")
            lines.append(f"Decision: {r.get('decision', 'none')[:300]}")
            if r.get("dissent_points"):
                lines.append(f"Dissent: {'; '.join(r['dissent_points'][:2])}")
        lines.append("\n=== END PRIOR DECISIONS ===\n")
        return "\n".join(lines)

from __future__ import annotations

import json
import time
from collections import defaultdict
from dataclasses import asdict
from datetime import datetime, timezone

from .types import AuditEntry


class AuditTrail:
    def __init__(self, debate_id: str):
        self.debate_id = debate_id
        self.entries: list[AuditEntry] = []

    def record(
        self,
        step: str,
        model_id: str,
        input_summary: str,
        output_summary: str,
        latency_ms: int,
        tokens_in: int,
        tokens_out: int,
        cost: float,
        round_number: int,
    ) -> AuditEntry:
        entry = AuditEntry(
            step=step,
            model_id=model_id,
            input_summary=input_summary,
            output_summary=output_summary,
            latency_ms=latency_ms,
            tokens_in=tokens_in,
            tokens_out=tokens_out,
            cost=cost,
            round_number=round_number,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self.entries.append(entry)
        return entry

    def to_dict(self) -> list[dict]:
        return [asdict(e) for e in self.entries]

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)

    def total_cost(self) -> float:
        return sum(e.cost for e in self.entries)

    def total_tokens(self) -> tuple[int, int]:
        return (
            sum(e.tokens_in for e in self.entries),
            sum(e.tokens_out for e in self.entries),
        )

    def total_latency_ms(self) -> int:
        return sum(e.latency_ms for e in self.entries)

    def by_model(self) -> dict[str, list[AuditEntry]]:
        result: dict[str, list[AuditEntry]] = defaultdict(list)
        for e in self.entries:
            result[e.model_id].append(e)
        return dict(result)

    def by_round(self) -> dict[int, list[AuditEntry]]:
        result: dict[int, list[AuditEntry]] = defaultdict(list)
        for e in self.entries:
            result[e.round_number].append(e)
        return dict(result)


async def audited_call(
    trail: AuditTrail,
    step: str,
    model_id: str,
    prompt: str,
    call_fn,
    round_number: int = 0,
) -> tuple[str, AuditEntry]:
    start = time.monotonic()
    response = await call_fn(model_id, prompt)
    end = time.monotonic()
    latency_ms = int((end - start) * 1000)

    entry = trail.record(
        step=step,
        model_id=model_id,
        input_summary=prompt[:200],
        output_summary=response[:200],
        latency_ms=latency_ms,
        tokens_in=0,
        tokens_out=0,
        cost=0.0,
        round_number=round_number,
    )
    return response, entry


def format_audit_report(trail: AuditTrail) -> str:
    tokens_in, tokens_out = trail.total_tokens()
    lines = [
        f"Audit Trail: {trail.debate_id}",
        f"Total Cost: ${trail.total_cost():.4f}",
        f"Total Tokens: {tokens_in} in / {tokens_out} out",
        f"Total Latency: {trail.total_latency_ms()}ms",
        "",
        "By Round:",
    ]

    for rnd, entries in sorted(trail.by_round().items()):
        cost = sum(e.cost for e in entries)
        latency = sum(e.latency_ms for e in entries)
        lines.append(f"  Round {rnd}: {len(entries)} calls, ${cost:.4f}, {latency}ms")

    lines.append("")
    lines.append("By Model:")

    for model, entries in sorted(trail.by_model().items()):
        cost = sum(e.cost for e in entries)
        lines.append(f"  {model}: {len(entries)} calls, ${cost:.4f}")

    return "\n".join(lines)

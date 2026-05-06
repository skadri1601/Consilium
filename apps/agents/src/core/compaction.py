"""Session compaction for long debates.

When a debate runs many rounds with sub-agent research the context
handed to the judge can outgrow the model's window. This module
summarizes earlier rounds into a compact "continuation message" so the
final judge prompt fits.

Usage from the orchestrator:

>>> compactor = Compactor(max_chars=80_000)
>>> if compactor.should_compact(rounds):
...     summary = compactor.compact(rounds, keep_last=1)
...     # ``summary.continuation`` replaces the verbatim early rounds in
...     # the judge prompt; ``summary.dropped_rounds`` is metadata for
...     # SSE / audit.

The implementation is deliberately deterministic and dependency-free —
no LLM calls — so it can run inside the request path without adding
another point of failure. Callers that want a model-summarized version
can wrap :func:`Compactor.compact` and replace ``continuation`` with the
LLM output, but the default keeps Consilium's "no surprises" guarantee.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable, Sequence


# Rough token estimate: 1 token ≈ 4 chars for English (OpenAI guidance).
# We work in chars throughout because every provider reports token
# limits differently and chars are a stable lower bound.
_CHARS_PER_TOKEN = 4


@dataclass(frozen=True)
class RoundRecord:
    """The minimum a compactor needs to summarize a round.

    The orchestrator already has richer round records; this is the
    contract — anything that exposes ``round_number``, ``responses``,
    and optional ``description`` works.
    """

    round_number: int
    responses: dict[str, str]
    description: str = ""


@dataclass(frozen=True)
class CompactionResult:
    continuation: str
    dropped_rounds: tuple[int, ...]
    kept_rounds: tuple[int, ...]
    chars_before: int
    chars_after: int
    ratio: float = field(init=False, default=0.0)

    def __post_init__(self) -> None:
        ratio = (self.chars_after / self.chars_before) if self.chars_before else 1.0
        object.__setattr__(self, "ratio", ratio)


def estimate_tokens(text: str) -> int:
    """Lower-bound token estimate for ``text`` in chars / 4."""
    return max(1, len(text) // _CHARS_PER_TOKEN)


def total_chars(rounds: Iterable[RoundRecord]) -> int:
    return sum(
        sum(len(r) for r in rec.responses.values()) + len(rec.description)
        for rec in rounds
    )


def _summarize_round(rec: RoundRecord, per_response_chars: int) -> str:
    lines = [f"### Round {rec.round_number}"]
    if rec.description:
        lines.append(rec.description.strip())
    for model_id, text in rec.responses.items():
        snippet = (text or "").strip().replace("\n", " ")
        if len(snippet) > per_response_chars:
            snippet = snippet[: per_response_chars - 1].rstrip() + "…"
        lines.append(f"- **{model_id}**: {snippet}")
    return "\n".join(lines)


@dataclass
class Compactor:
    """Heuristic round compactor.

    ``max_chars`` is the target character budget for the *combined*
    earlier-round summary. ``per_response_chars`` caps how much each
    individual model response contributes; this keeps a single rambling
    response from dominating the budget.
    """

    max_chars: int = 80_000
    per_response_chars: int = 600

    def should_compact(self, rounds: Sequence[RoundRecord]) -> bool:
        return total_chars(rounds) > self.max_chars

    def compact(
        self,
        rounds: Sequence[RoundRecord],
        *,
        keep_last: int = 1,
    ) -> CompactionResult:
        if keep_last < 0:
            raise ValueError("keep_last must be >= 0")
        if keep_last >= len(rounds):
            raw = "\n\n".join(_summarize_round(r, self.per_response_chars) for r in rounds)
            return CompactionResult(
                continuation=raw,
                dropped_rounds=(),
                kept_rounds=tuple(r.round_number for r in rounds),
                chars_before=total_chars(rounds),
                chars_after=len(raw),
            )

        head = rounds[: len(rounds) - keep_last]
        tail = rounds[len(rounds) - keep_last :]

        head_text = "\n\n".join(_summarize_round(r, self.per_response_chars) for r in head)

        if len(head_text) > self.max_chars:
            head_text = self._second_pass_trim(head, self.max_chars)

        sections: list[str] = []
        if head_text:
            sections.append(
                "## Earlier rounds (compacted summary)\n"
                f"_Rounds {head[0].round_number}–{head[-1].round_number} were "
                "summarized to keep within the context budget._\n\n" + head_text
            )

        return CompactionResult(
            continuation="\n\n".join(sections),
            dropped_rounds=tuple(r.round_number for r in head),
            kept_rounds=tuple(r.round_number for r in tail),
            chars_before=total_chars(rounds),
            chars_after=sum(len(s) for s in sections),
        )

    def _second_pass_trim(self, rounds: Sequence[RoundRecord], budget: int) -> str:
        per = max(120, self.per_response_chars // 2)
        while per >= 60:
            text = "\n\n".join(_summarize_round(r, per) for r in rounds)
            if len(text) <= budget:
                return text
            per //= 2
        text = "\n\n".join(_summarize_round(r, 60) for r in rounds)
        if len(text) <= budget:
            return text
        return text[: budget - 1].rstrip() + "…"


__all__ = [
    "Compactor",
    "CompactionResult",
    "RoundRecord",
    "estimate_tokens",
    "total_chars",
]

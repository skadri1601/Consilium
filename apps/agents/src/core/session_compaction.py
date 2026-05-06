from __future__ import annotations

import logging
import re
from dataclasses import dataclass

logger = logging.getLogger(__name__)

TOKENS_PER_CHAR = 0.25

CONTINUATION_PREAMBLE = (
    "This debate session is being continued from earlier rounds that have been "
    "compacted to fit within context limits.\n"
    "The summary below captures key positions, arguments, and areas of agreement/disagreement.\n"
    "Recent round responses are preserved verbatim.\n"
    "Continue the deliberation from where it left off without recapping prior rounds."
)


@dataclass
class CompactionConfig:
    max_estimated_tokens: int = 10000
    preserve_recent_rounds: int = 1
    max_summary_length: int = 2000


@dataclass
class CompactionResult:
    compacted: bool
    original_tokens: int
    compacted_tokens: int
    summary: str | None = None
    preserved_responses: dict[int, dict[str, str]] | None = None


def estimate_tokens(text: str) -> int:
    return int(len(text) * TOKENS_PER_CHAR) + 1


def _extract_key_claims(text: str) -> list[str]:
    claims = []
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith(("-", "*", "•")) and len(stripped) > 10:
            claims.append(stripped)
        elif re.match(r"^\d+[.)]\s", stripped) and len(stripped) > 10:
            claims.append(stripped)
    return claims[:10]


def _summarize_round(round_number: int, responses: dict[str, str]) -> str:
    parts = [f"Round {round_number}:"]
    for model_id, text in responses.items():
        claims = _extract_key_claims(text)
        if claims:
            parts.append(f"  {model_id}: {'; '.join(c[:80] for c in claims[:3])}")
        else:
            parts.append(f"  {model_id}: {text[:150].replace(chr(10), ' ')}")
    return "\n".join(parts)


def compact_debate_context(
    all_responses: dict[int, dict[str, str]],
    config: CompactionConfig | None = None,
) -> CompactionResult:
    config = config or CompactionConfig()

    total_text = ""
    for round_responses in all_responses.values():
        for text in round_responses.values():
            total_text += text

    original_tokens = estimate_tokens(total_text)

    if original_tokens <= config.max_estimated_tokens:
        return CompactionResult(
            compacted=False,
            original_tokens=original_tokens,
            compacted_tokens=original_tokens,
        )

    sorted_rounds = sorted(all_responses.keys())
    if not sorted_rounds:
        return CompactionResult(
            compacted=False,
            original_tokens=0,
            compacted_tokens=0,
        )

    preserve_from = max(sorted_rounds) - config.preserve_recent_rounds + 1
    rounds_to_compact = [r for r in sorted_rounds if r < preserve_from]
    rounds_to_preserve = [r for r in sorted_rounds if r >= preserve_from]

    if not rounds_to_compact:
        return CompactionResult(
            compacted=False,
            original_tokens=original_tokens,
            compacted_tokens=original_tokens,
        )

    summary_parts = [CONTINUATION_PREAMBLE, "", "=== COMPACTED SUMMARY ==="]
    for round_num in rounds_to_compact:
        round_summary = _summarize_round(round_num, all_responses[round_num])
        summary_parts.append(round_summary)
    summary_parts.append("=== END COMPACTED SUMMARY ===")

    summary = "\n".join(summary_parts)
    if len(summary) > config.max_summary_length:
        summary = summary[:config.max_summary_length] + "\n[...truncated]"

    preserved = {r: all_responses[r] for r in rounds_to_preserve}

    preserved_text = ""
    for round_responses in preserved.values():
        for text in round_responses.values():
            preserved_text += text

    compacted_tokens = estimate_tokens(summary) + estimate_tokens(preserved_text)

    logger.info(
        "Session compacted: %d tokens -> %d tokens (%.0f%% reduction)",
        original_tokens, compacted_tokens,
        (1 - compacted_tokens / original_tokens) * 100 if original_tokens > 0 else 0,
    )

    return CompactionResult(
        compacted=True,
        original_tokens=original_tokens,
        compacted_tokens=compacted_tokens,
        summary=summary,
        preserved_responses=preserved,
    )


def build_compacted_prompt(
    topic: str,
    compaction: CompactionResult,
    round_number: int,
) -> str:
    if not compaction.compacted or not compaction.summary:
        return topic

    parts = [compaction.summary, "", f"=== CURRENT TOPIC (Round {round_number}) ===", topic]
    return "\n".join(parts)

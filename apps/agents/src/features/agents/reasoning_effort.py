from __future__ import annotations

from typing import Literal, Optional

EffortLevel = Literal["low", "medium", "high", "xhigh", "max"]

VALID_EFFORTS: frozenset[str] = frozenset({"low", "medium", "high", "xhigh", "max"})


def normalize_effort(value: Optional[str]) -> Optional[EffortLevel]:
    if value is None:
        return None
    lowered = value.lower().strip()
    if lowered in VALID_EFFORTS:
        return lowered  # type: ignore[return-value]
    return None


def to_anthropic_budget(effort: Optional[EffortLevel]) -> Optional[dict]:
    if effort is None or effort == "low":
        return None
    budgets = {
        "medium": 4096,
        "high": 8192,
        "xhigh": 16384,
        "max": 32768,
    }
    return {"type": "enabled", "budget_tokens": budgets[effort]}


def to_openai_effort(effort: Optional[EffortLevel]) -> Optional[str]:
    if effort is None:
        return None
    mapping = {
        "low": "low",
        "medium": "medium",
        "high": "high",
        "xhigh": "high",
        "max": "high",
    }
    return mapping[effort]


def to_xai_effort(effort: Optional[EffortLevel]) -> Optional[str]:
    return to_openai_effort(effort)

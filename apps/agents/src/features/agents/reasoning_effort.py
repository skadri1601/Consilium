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


_ADAPTIVE_THINKING_TAGS: tuple[str, ...] = (
    "opus-4-6",
    "opus-4-7",
    "opus-4-8",
    "sonnet-4-6",
    "sonnet-5",
    "fable-5",
    "mythos-5",
)


def supports_adaptive_thinking(model_id: str) -> bool:
    return any(tag in model_id for tag in _ADAPTIVE_THINKING_TAGS)


def apply_anthropic_thinking(
    kwargs: dict, model_id: str, reasoning_effort: Optional[str]
) -> None:
    effort = normalize_effort(reasoning_effort)
    if effort is None:
        return
    if supports_adaptive_thinking(model_id):
        if effort != "low":
            kwargs["thinking"] = {"type": "adaptive"}
            kwargs["max_tokens"] = max(kwargs.get("max_tokens", 2000), 8000)
        return
    budget = to_anthropic_budget(effort)
    if budget is not None:
        kwargs["thinking"] = budget
        kwargs["temperature"] = 1
        kwargs["max_tokens"] = max(
            kwargs.get("max_tokens", 2000), budget["budget_tokens"] + 1024
        )

from __future__ import annotations

import enum
import re
from dataclasses import dataclass, field


class RoutingStrategy(str, enum.Enum):
    COST_OPTIMIZED = "cost_optimized"
    QUALITY_FIRST = "quality_first"
    BALANCED = "balanced"


MODEL_TIERS: dict[str, str] = {
    "claude-opus-4-7": "premium",
    "claude-opus-4-6": "premium",
    "gpt-5.5": "premium",
    "gpt-5.5-pro": "premium",
    "claude-sonnet-4-6": "standard",
    "gpt-5.4": "standard",
    "gemini-3.1-pro-preview": "standard",
    "grok-4-1-fast-reasoning": "standard",
    "claude-haiku-4-5-20251001": "economy",
    "gpt-5.4-mini": "economy",
    "gemini-3-flash-preview": "economy",
    "grok-4-1-fast-non-reasoning": "economy",
}

TIER_COST_ESTIMATE: dict[str, float] = {
    "premium": 0.05,
    "standard": 0.01,
    "economy": 0.002,
}

TIER_ORDER = ["economy", "standard", "premium"]

COMPLEXITY_INDICATORS = [
    (r"\b(design|architect|implement)\b", 2),
    (r"\b(distributed|consensus|byzantine)\b", 3),
    (r"\b(prove|theorem|proof)\b", 3),
    (r"\b(optimize|performance|scalability)\b", 2),
    (r"\b(security|vulnerability|attack)\b", 2),
    (r"\b(compare|tradeoff|versus)\b", 1),
    (r"\b(what is|define|explain)\b", -1),
    (r"\b(simple|basic|easy)\b", -2),
]


def _get_provider(model_id: str) -> str:
    try:
        from src.shared.config.models import get_provider_for_model

        result = get_provider_for_model(model_id)
        if result:
            return result
    except (ImportError, Exception):
        pass
    if model_id.startswith(("gpt-", "o1-", "o3-")):
        return "openai"
    if model_id.startswith("claude-"):
        return "anthropic"
    if model_id.startswith("gemini-"):
        return "google"
    if model_id.startswith("grok-"):
        return "xai"
    if model_id.startswith(("llama-", "mixtral-")):
        return "groq"
    return "unknown"


def _estimate_complexity(query: str) -> float:
    score = 0
    for pattern, weight in COMPLEXITY_INDICATORS:
        if re.search(pattern, query, re.IGNORECASE):
            score += weight
    word_count = len(query.split())
    if word_count > 100:
        score += 2
    elif word_count < 20:
        score -= 1
    return max(0.0, min(1.0, (score + 3) / 10))


def _get_tier(model: str) -> str:
    return MODEL_TIERS.get(model, "standard")


@dataclass
class RouteResult:
    selected_model: str
    reason: str
    complexity_score: float = 0.0
    estimated_cost: float = 0.0
    fallback_chain: list[str] = field(default_factory=list)


class ModelRouter:
    def __init__(
        self,
        strategy: RoutingStrategy = RoutingStrategy.BALANCED,
        max_cost_per_request: float | None = None,
    ):
        self._strategy = strategy
        self._max_cost = max_cost_per_request

    def _filter_available(
        self, models: list[str], unavailable_providers: list[str] | None = None
    ) -> list[str]:
        if not unavailable_providers:
            return models
        return [
            m for m in models if _get_provider(m) not in unavailable_providers
        ]

    def _sort_by_strategy(
        self, models: list[str], complexity: float
    ) -> list[str]:
        def sort_key(m: str) -> tuple[int, str]:
            tier = _get_tier(m)
            tier_idx = TIER_ORDER.index(tier) if tier in TIER_ORDER else 1
            if self._strategy == RoutingStrategy.COST_OPTIMIZED:
                return (tier_idx, m)
            elif self._strategy == RoutingStrategy.QUALITY_FIRST:
                return (-tier_idx, m)
            else:
                target_idx = round(complexity * 2)
                return (abs(tier_idx - target_idx), m)

        return sorted(models, key=sort_key)

    def route(
        self,
        query: str,
        available_models: list[str],
        unavailable_providers: list[str] | None = None,
    ) -> RouteResult:
        complexity = _estimate_complexity(query)
        filtered = self._filter_available(available_models, unavailable_providers)
        if not filtered:
            return RouteResult(
                selected_model=available_models[0]
                if available_models
                else "unknown",
                reason="No available models after filtering",
                complexity_score=complexity,
            )
        sorted_models = self._sort_by_strategy(filtered, complexity)
        if self._max_cost is not None:
            affordable = [
                m
                for m in sorted_models
                if TIER_COST_ESTIMATE.get(_get_tier(m), 0.01) <= self._max_cost
            ]
            if affordable:
                sorted_models = affordable
        selected = sorted_models[0]
        tier = _get_tier(selected)
        cost = TIER_COST_ESTIMATE.get(tier, 0.01)
        reason_parts = [
            f"Strategy: {self._strategy.value}",
            f"Complexity: {complexity:.2f}",
            f"Tier: {tier}",
        ]
        if unavailable_providers:
            reason_parts.append(
                f"Failover from: {', '.join(unavailable_providers)}"
            )
        return RouteResult(
            selected_model=selected,
            reason="; ".join(reason_parts),
            complexity_score=complexity,
            estimated_cost=cost,
            fallback_chain=sorted_models[1:3],
        )

    def route_panel(
        self,
        query: str,
        available_models: list[str],
        panel_size: int = 3,
        unavailable_providers: list[str] | None = None,
    ) -> list[RouteResult]:
        complexity = _estimate_complexity(query)
        filtered = self._filter_available(available_models, unavailable_providers)
        sorted_models = self._sort_by_strategy(filtered, complexity)
        results: list[RouteResult] = []
        used_providers: set[str] = set()
        for model in sorted_models:
            if len(results) >= panel_size:
                break
            provider = _get_provider(model)
            if (
                provider != "unknown"
                and provider in used_providers
                and len(results) < panel_size - 1
            ):
                continue
            if provider != "unknown":
                used_providers.add(provider)
            tier = _get_tier(model)
            results.append(
                RouteResult(
                    selected_model=model,
                    reason=f"Panel member ({tier}); complexity={complexity:.2f}",
                    complexity_score=complexity,
                    estimated_cost=TIER_COST_ESTIMATE.get(tier, 0.01),
                )
            )
        for model in sorted_models:
            if len(results) >= panel_size:
                break
            if model not in [r.selected_model for r in results]:
                tier = _get_tier(model)
                results.append(
                    RouteResult(
                        selected_model=model,
                        reason=f"Panel fill ({tier})",
                        complexity_score=complexity,
                        estimated_cost=TIER_COST_ESTIMATE.get(tier, 0.01),
                    )
                )
        return results[:panel_size]

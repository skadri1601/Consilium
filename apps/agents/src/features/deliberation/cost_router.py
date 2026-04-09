from __future__ import annotations

import re

from src.features.deliberation.types import RoutingDecision


CODE_MARKERS = ("```", "def ", "function ", "class ", "import ", "{", "}")
FACTUAL_PREFIXES = ("what is", "who is", "when did", "how many")
CREATIVE_KEYWORDS = ("write", "create", "design", "brainstorm", "imagine")
ANALYTICAL_KEYWORDS = ("compare", "analyze", "evaluate", "pros and cons", "tradeoffs")
STAKES_KEYWORDS = ("medical", "legal", "financial", "security", "compliance", "hipaa", "soc", "audit")


def extract_features(topic: str) -> dict:
    tokens = topic.split()
    token_count = len(tokens)
    lower = topic.lower()

    has_code = any(marker in topic for marker in CODE_MARKERS)
    is_factual = any(lower.startswith(p) for p in FACTUAL_PREFIXES)
    is_creative = any(k in lower for k in CREATIVE_KEYWORDS)
    is_analytical = any(k in lower for k in ANALYTICAL_KEYWORDS)
    has_stakes_keywords = any(k in lower for k in STAKES_KEYWORDS)

    if token_count < 10:
        question_complexity = "simple"
    elif token_count < 50:
        question_complexity = "moderate"
    else:
        question_complexity = "complex"

    return {
        "token_count": token_count,
        "has_code": has_code,
        "is_factual": is_factual,
        "is_creative": is_creative,
        "is_analytical": is_analytical,
        "has_stakes_keywords": has_stakes_keywords,
        "question_complexity": question_complexity,
    }


def compute_complexity_score(features: dict) -> float:
    tc = features["token_count"]
    if tc < 20:
        score = 0.1
    elif tc <= 100:
        score = 0.3
    elif tc <= 500:
        score = 0.5
    else:
        score = 0.7

    if features["has_code"]:
        score += 0.2
    if features["has_stakes_keywords"]:
        score += 0.3
    if features["is_analytical"]:
        score += 0.2
    if features["is_creative"]:
        score += 0.1
    if features["is_factual"]:
        score -= 0.2

    return max(0.0, min(1.0, score))


def route(
    topic: str,
    available_models: list[str] | None = None,
    user_preference: str | None = None,
) -> RoutingDecision:
    if user_preference is not None and user_preference != "auto":
        return RoutingDecision(mode=user_preference, reason="user preference")

    features = extract_features(topic)
    score = compute_complexity_score(features)

    if features["has_stakes_keywords"] and score < 0.3:
        score = 0.3

    if score < 0.3:
        return RoutingDecision(mode="quick", models=1, reason="simple query")
    elif score < 0.6:
        return RoutingDecision(mode="council", models=3, reason="moderate complexity")
    else:
        num_models = 5 if score >= 0.8 else 3
        return RoutingDecision(mode="council", models=num_models, reason="complex/high-stakes")


def estimate_cost(mode: str, num_models: int, estimated_tokens: int) -> float:
    cost_per_token = 0.003 / 1000

    if mode == "quick":
        calls = 1
    elif mode == "council":
        calls = num_models * 3
    elif mode == "deep":
        calls = num_models * 5
    else:
        calls = num_models

    return calls * estimated_tokens * cost_per_token

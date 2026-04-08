import logging
import math
import os
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

FALLBACK_RESPONSE = "[No response from this agent]"


@dataclass
class ConvergenceResult:
    converged: bool
    average_similarity: float
    pairwise_scores: list[tuple[str, str, float]] = field(default_factory=list)


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def compute_pairwise_similarity(
    model_ids: list[str], embeddings: list[list[float]]
) -> tuple[float, list[tuple[str, str, float]]]:
    pairs = []
    for i in range(len(embeddings)):
        for j in range(i + 1, len(embeddings)):
            sim = cosine_similarity(embeddings[i], embeddings[j])
            pairs.append((model_ids[i], model_ids[j], sim))
    avg = sum(s for _, _, s in pairs) / len(pairs) if pairs else 0.0
    return avg, pairs


def resolve_openai_key(api_keys: dict[str, str | None]) -> str | None:
    for key_name in ("openaiKey", "openai_key", "openai"):
        val = api_keys.get(key_name)
        if val:
            return val
    return os.getenv("OPENAI_API_KEY")


async def compute_embeddings(texts: list[str], api_key: str) -> list[list[float]]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
    )
    return [item.embedding for item in response.data]


async def check_convergence(
    responses: dict[str, str],
    api_keys: dict[str, str | None],
    threshold: float = 0.92,
) -> ConvergenceResult:
    if threshold <= 0:
        return ConvergenceResult(converged=False, average_similarity=0.0)

    openai_key = resolve_openai_key(api_keys)
    if not openai_key:
        logger.info("No OpenAI key available, skipping convergence check")
        return ConvergenceResult(converged=False, average_similarity=0.0)

    valid = {k: v for k, v in responses.items() if v and v != FALLBACK_RESPONSE}
    if len(valid) < 2:
        return ConvergenceResult(converged=False, average_similarity=0.0)

    model_ids = list(valid.keys())
    texts = list(valid.values())

    try:
        embeddings = await compute_embeddings(texts, openai_key)
        avg_sim, pairs = compute_pairwise_similarity(model_ids, embeddings)
        converged = avg_sim >= threshold
        if converged:
            logger.info(
                "Convergence detected: avg_similarity=%.4f (threshold=%.2f)",
                avg_sim, threshold,
            )
        return ConvergenceResult(
            converged=converged,
            average_similarity=avg_sim,
            pairwise_scores=pairs,
        )
    except Exception as exc:
        logger.warning("Convergence check failed: %s", exc)
        return ConvergenceResult(converged=False, average_similarity=0.0)

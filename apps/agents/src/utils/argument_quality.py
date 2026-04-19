import json
from typing import Any

QUALITY_PROMPT = """Rate this argument on 5 dimensions, each 1-5. Return ONLY valid JSON.

Argument: {argument}

Dimensions:
- relevance: Does it address the topic directly?
- sufficiency: Is evidence/reasoning sufficient?
- acceptability: Are premises credible and well-supported?
- cogency: Is the logical structure sound?
- rebuttal_quality: Does it address counterarguments?

Return: {{"relevance":N,"sufficiency":N,"acceptability":N,"cogency":N,"rebuttal_quality":N}}"""


async def score_argument(argument: str, llm_call_fn: Any) -> dict[str, Any]:
    try:
        prompt = QUALITY_PROMPT.format(argument=argument[:2000])
        response = await llm_call_fn(prompt, max_tokens=100)
        scores = json.loads(response.strip())
        total = sum(scores.values())
        scores["total"] = total
        scores["quality_pct"] = round(total / 25.0, 3)
        return scores
    except Exception:
        return {"relevance": 0, "sufficiency": 0, "acceptability": 0, "cogency": 0, "rebuttal_quality": 0, "total": 0, "quality_pct": 0.0}

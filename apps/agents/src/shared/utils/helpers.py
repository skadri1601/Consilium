import uuid
from typing import Dict


# Token pricing per 1000 tokens (approximate)
TOKEN_PRICING: Dict[str, Dict[str, float]] = {
    "gpt-5.4": {"input": 0.002, "output": 0.008},
    "gpt-5.4-mini": {"input": 0.0002, "output": 0.0008},
    "gpt-5.5": {"input": 0.003, "output": 0.012},
    "claude-opus-4-7": {"input": 0.015, "output": 0.075},
    "claude-sonnet-4-6": {"input": 0.003, "output": 0.015},
    "claude-haiku-4-5-20251001": {"input": 0.0008, "output": 0.004},
    "gemini-3.1-pro-preview": {"input": 0.00125, "output": 0.005},
    "gemini-3-flash-preview": {"input": 0.00015, "output": 0.0006},
}


def generate_session_id() -> str:
    """Generate a unique session ID."""
    return str(uuid.uuid4())


def calculate_cost(
    model: str,
    input_tokens: int,
    output_tokens: int
) -> float:
    """
    Calculate the cost for API usage.

    Args:
        model: The model identifier
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens

    Returns:
        Cost in USD
    """
    pricing = TOKEN_PRICING.get(model, {"input": 0.01, "output": 0.03})

    input_cost = (input_tokens / 1000) * pricing["input"]
    output_cost = (output_tokens / 1000) * pricing["output"]

    return round(input_cost + output_cost, 6)


def format_tokens(tokens: int) -> str:
    """Format token count for display."""
    if tokens >= 1_000_000:
        return f"{tokens / 1_000_000:.1f}M"
    elif tokens >= 1_000:
        return f"{tokens / 1_000:.1f}K"
    return str(tokens)

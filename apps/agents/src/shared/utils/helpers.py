import uuid
from typing import Dict


# Token pricing per 1000 tokens (approximate)
TOKEN_PRICING: Dict[str, Dict[str, float]] = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
    "claude-3-sonnet": {"input": 0.003, "output": 0.015},
    "gemini-pro": {"input": 0.00025, "output": 0.0005},
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

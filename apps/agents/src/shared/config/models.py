"""Available LLM models configuration."""

AVAILABLE_MODELS = {
    "openai": [
        {
            "id": "gpt-4o-mini",
            "name": "GPT-4o Mini",
            "input_cost": 0.15,  # per 1M tokens
            "output_cost": 0.60,  # per 1M tokens
        },
        {
            "id": "gpt-4o",
            "name": "GPT-4o",
            "input_cost": 2.50,
            "output_cost": 10.00,
        },
        {
            "id": "gpt-4-turbo",
            "name": "GPT-4 Turbo",
            "input_cost": 10.00,
            "output_cost": 30.00,
        },
    ],
    "anthropic": [
        {
            "id": "claude-3-5-haiku-latest",
            "name": "Claude 3.5 Haiku",
            "input_cost": 0.80,
            "output_cost": 4.00,
        },
        {
            "id": "claude-3-5-sonnet-latest",
            "name": "Claude 3.5 Sonnet",
            "input_cost": 3.00,
            "output_cost": 15.00,
        },
        {
            "id": "claude-3-opus-latest",
            "name": "Claude 3 Opus",
            "input_cost": 15.00,
            "output_cost": 75.00,
        },
    ],
    "google": [
        {
            "id": "gemini-3-flash-preview",
            "name": "Gemini 3.0 Flash (Preview)",
            "input_cost": 0.10,
            "output_cost": 0.40,
        },
        {
            "id": "gemini-2.5-flash",
            "name": "Gemini 2.5 Flash",
            "input_cost": 0.10,
            "output_cost": 0.40,
        },
        {
            "id": "gemini-2.5-pro",
            "name": "Gemini 2.5 Pro",
            "input_cost": 1.25,
            "output_cost": 5.00,
        },
        {
            "id": "gemini-2.0-flash",
            "name": "Gemini 2.0 Flash",
            "input_cost": 0.10,
            "output_cost": 0.40,
        },
        {
            "id": "gemini-exp-1206",
            "name": "Gemini Experimental (Dec 2024)",
            "input_cost": 0.10,
            "output_cost": 0.40,
        },
    ],
    "groq": [
        {
            "id": "llama-3.1-8b-instant",
            "name": "Llama 3.1 8B Instant",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "llama-3.1-70b-versatile",
            "name": "Llama 3.1 70B Versatile",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "mixtral-8x7b-32768",
            "name": "Mixtral 8x7B 32K",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
    ],
    "xai": [
        {
            "id": "grok-beta",
            "name": "Grok Beta",
            "input_cost": 5.00,  # per 1M tokens (estimated)
            "output_cost": 15.00,  # per 1M tokens (estimated)
        },
    ],
}


def get_model_info(model_id: str) -> dict | None:
    """Get model information by ID."""
    for provider_models in AVAILABLE_MODELS.values():
        for model in provider_models:
            if model["id"] == model_id:
                return model
    return None


def get_provider_for_model(model_id: str) -> str | None:
    """Get provider name for a given model ID."""
    for provider, models in AVAILABLE_MODELS.items():
        for model in models:
            if model["id"] == model_id:
                return provider
    return None


def calculate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    """Calculate cost for a model usage."""
    model_info = get_model_info(model_id)
    if not model_info:
        return 0.0

    input_cost = (input_tokens / 1_000_000) * model_info["input_cost"]
    output_cost = (output_tokens / 1_000_000) * model_info["output_cost"]
    return input_cost + output_cost


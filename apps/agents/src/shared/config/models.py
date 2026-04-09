"""Available LLM models configuration."""

AVAILABLE_MODELS = {
    "openai": [
        {
            "id": "gpt-4o-mini",
            "name": "GPT-4o Mini",
            "input_cost": 0.15,
            "output_cost": 0.60,
        },
        {
            "id": "gpt-4o",
            "name": "GPT-4o",
            "input_cost": 2.50,
            "output_cost": 10.00,
        },
        {
            "id": "gpt-4.1",
            "name": "GPT-4.1",
            "input_cost": 2.00,
            "output_cost": 8.00,
        },
        {
            "id": "o3-mini",
            "name": "o3-mini",
            "input_cost": 1.10,
            "output_cost": 4.40,
        },
    ],
    "anthropic": [
        {
            "id": "claude-haiku-4-5",
            "name": "Claude Haiku 4.5",
            "input_cost": 0.80,
            "output_cost": 4.00,
        },
        {
            "id": "claude-sonnet-4-5",
            "name": "Claude Sonnet 4.5",
            "input_cost": 3.00,
            "output_cost": 15.00,
        },
        {
            "id": "claude-opus-4-6",
            "name": "Claude Opus 4.6",
            "input_cost": 15.00,
            "output_cost": 75.00,
        },
    ],
    "google": [
        {
            "id": "gemini-2.0-flash",
            "name": "Gemini 2.0 Flash",
            "input_cost": 0.10,
            "output_cost": 0.40,
        },
        {
            "id": "gemini-2.5-flash",
            "name": "Gemini 2.5 Flash",
            "input_cost": 0.15,
            "output_cost": 0.60,
        },
        {
            "id": "gemini-2.5-pro",
            "name": "Gemini 2.5 Pro",
            "input_cost": 1.25,
            "output_cost": 5.00,
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
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B Versatile",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "llama-4-scout-17b-16e-instruct",
            "name": "Llama 4 Scout 17B",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
    ],
    "xai": [
        {
            "id": "grok-2",
            "name": "Grok 2",
            "input_cost": 2.00,
            "output_cost": 10.00,
        },
        {
            "id": "grok-2-mini",
            "name": "Grok 2 Mini",
            "input_cost": 0.30,
            "output_cost": 1.00,
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


MODEL_ALIASES = {
    "llama-3.1-70b-versatile": "llama-3.3-70b-versatile",
    "claude-3-5-haiku-latest": "claude-haiku-4-5",
    "claude-3-5-sonnet-latest": "claude-sonnet-4-5",
    "claude-sonnet-4-20250514": "claude-sonnet-4-5",
    "claude-haiku-4-5-20251001": "claude-haiku-4-5",
    "claude-opus-4-20250918": "claude-opus-4-6",
    "claude-4.6-opus": "claude-opus-4-6",
    "claude-3-opus-latest": "claude-opus-4-6",
    "claude-4.5-sonnet": "claude-sonnet-4-5",
    "o1": "o3-mini",
    "gpt-4-turbo": "gpt-4.1",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.5-flash": "gemini-2.5-flash",
    "gemini-3-flash-preview": "gemini-2.5-flash",
    "gemini-exp-1206": "gemini-2.0-flash",
    "grok-beta": "grok-2",
    "mixtral-8x7b-32768": "llama-3.3-70b-versatile",
}


def _resolve_model_id(model_id: str) -> str:
    return MODEL_ALIASES.get(model_id, model_id)


def get_provider_for_model(model_id: str) -> str | None:
    resolved = _resolve_model_id(model_id)
    for provider, models in AVAILABLE_MODELS.items():
        for model in models:
            if model["id"] == resolved:
                return provider
    return None


def calculate_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    model_info = get_model_info(model_id)
    if not model_info:
        return 0.0

    input_cost = (input_tokens / 1_000_000) * model_info["input_cost"]
    output_cost = (output_tokens / 1_000_000) * model_info["output_cost"]
    return input_cost + output_cost


FREE_FALLBACK_MODELS = {
    "debater": "llama-3.1-8b-instant",
    "judge": "llama-3.3-70b-versatile",
}

FREE_FALLBACK_PROVIDER = "groq"


def get_free_fallback_models(count: int = 2) -> list[str]:
    return [FREE_FALLBACK_MODELS["debater"]] * count


def get_free_fallback_judge() -> str:
    return FREE_FALLBACK_MODELS["judge"]


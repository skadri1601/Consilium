"""Available LLM models configuration.

Source of truth for the engine. Keeps only current-generation models —
anything deprecated by the provider is removed here (not just tagged)
so the engine never picks a model that will 404.
"""

AVAILABLE_MODELS = {
    "openai": [
        {
            "id": "gpt-5.4-nano",
            "name": "GPT-5.4 Nano",
            "input_cost": 0.08,
            "output_cost": 0.30,
        },
        {
            "id": "gpt-5.4-mini",
            "name": "GPT-5.4 Mini",
            "input_cost": 0.20,
            "output_cost": 0.80,
        },
        {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input_cost": 2.00,
            "output_cost": 8.00,
        },
        {
            "id": "gpt-5.5",
            "name": "GPT-5.5",
            "input_cost": 3.00,
            "output_cost": 12.00,
        },
        {
            "id": "gpt-5.5-pro",
            "name": "GPT-5.5 Pro",
            "input_cost": 8.00,
            "output_cost": 32.00,
        },
    ],
    "anthropic": [
        {
            "id": "claude-haiku-4-5-20251001",
            "name": "Claude Haiku 4.5",
            "input_cost": 1.00,
            "output_cost": 5.00,
        },
        {
            "id": "claude-sonnet-4-6",
            "name": "Claude Sonnet 4.6",
            "input_cost": 3.00,
            "output_cost": 15.00,
        },
        {
            "id": "claude-opus-4-6",
            "name": "Claude Opus 4.6",
            "input_cost": 5.00,
            "output_cost": 25.00,
        },
        {
            "id": "claude-opus-4-7",
            "name": "Claude Opus 4.7",
            "input_cost": 5.00,
            "output_cost": 25.00,
        },
    ],
    "google": [
        {
            "id": "gemini-3.1-flash-lite-preview",
            "name": "Gemini 3.1 Flash-Lite",
            "input_cost": 0.05,
            "output_cost": 0.20,
        },
        {
            "id": "gemini-3-flash-preview",
            "name": "Gemini 3 Flash",
            "input_cost": 0.15,
            "output_cost": 0.60,
        },
        {
            "id": "gemini-3.1-pro-preview",
            "name": "Gemini 3.1 Pro",
            "input_cost": 1.25,
            "output_cost": 5.00,
        },
    ],
    "groq": [
        {
            "id": "llama-3.1-8b-instant",
            "name": "Llama 3.1 8B Instant",
            "input_cost": 0.05,
            "output_cost": 0.08,
        },
        {
            "id": "llama-3.3-70b-versatile",
            "name": "Llama 3.3 70B Versatile",
            "input_cost": 0.59,
            "output_cost": 0.79,
        },
        {
            "id": "openai/gpt-oss-120b",
            "name": "GPT-OSS 120B (via Groq)",
            "input_cost": 0.15,
            "output_cost": 0.60,
        },
        {
            "id": "openai/gpt-oss-20b",
            "name": "GPT-OSS 20B (via Groq)",
            "input_cost": 0.05,
            "output_cost": 0.15,
        },
        {
            "id": "groq/compound",
            "name": "Groq Compound (agentic)",
            "input_cost": 0.80,
            "output_cost": 1.60,
        },
        {
            "id": "groq/compound-mini",
            "name": "Groq Compound Mini",
            "input_cost": 0.30,
            "output_cost": 0.60,
        },
    ],
    "xai": [
        {
            "id": "grok-code-fast-1",
            "name": "Grok Code Fast",
            "input_cost": 0.30,
            "output_cost": 1.20,
        },
        {
            "id": "grok-4-1-fast-non-reasoning",
            "name": "Grok 4.1 Fast (non-reasoning)",
            "input_cost": 0.50,
            "output_cost": 2.00,
        },
        {
            "id": "grok-4-1-fast-reasoning",
            "name": "Grok 4.1 Fast (reasoning)",
            "input_cost": 1.00,
            "output_cost": 4.00,
        },
        {
            "id": "grok-4-20",
            "name": "Grok 4.20",
            "input_cost": 3.00,
            "output_cost": 15.00,
        },
    ],
    "moonshot": [
        {
            "id": "kimi-k2.6",
            "name": "Kimi K2.6",
            "input_cost": 1.20,
            "output_cost": 2.50,
        },
        {
            "id": "kimi-k2.5",
            "name": "Kimi K2.5",
            "input_cost": 0.80,
            "output_cost": 1.80,
        },
        {
            "id": "kimi-k2-thinking",
            "name": "Kimi K2 Thinking",
            "input_cost": 1.20,
            "output_cost": 2.50,
        },
        {
            "id": "kimi-k2-thinking-turbo",
            "name": "Kimi K2 Thinking Turbo",
            "input_cost": 0.80,
            "output_cost": 1.80,
        },
        {
            "id": "kimi-k2-turbo-preview",
            "name": "Kimi K2 Turbo (preview)",
            "input_cost": 0.50,
            "output_cost": 1.20,
        },
    ],
    "openrouter": [
        {
            "id": "google/gemma-4-26b-a4b-it:free",
            "name": "Gemma 4 26B (OpenRouter free tier)",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "google/gemma-4-31b-it:free",
            "name": "Gemma 4 31B (OpenRouter free tier)",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "qwen/qwen3-coder:free",
            "name": "Qwen3 Coder (OpenRouter free tier)",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "nvidia/nemotron-3-super-120b-a12b:free",
            "name": "Nemotron 3 Super 120B (OpenRouter free tier)",
            "input_cost": 0.0,
            "output_cost": 0.0,
        },
        {
            "id": "inclusionai/ling-2.6-1t:free",
            "name": "Ling 2.6 1T (OpenRouter free tier)",
            "input_cost": 0.0,
            "output_cost": 0.0,
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


# Aliases forward legacy / short names to their current replacements.
# Only list aliases whose *target* is currently live — never alias
# something to a model that's retired or near-shutdown.
MODEL_ALIASES = {
    # OpenAI
    "gpt-4o": "gpt-5.4",
    "gpt-4o-mini": "gpt-5.4-mini",
    "gpt-4.1": "gpt-5.4",
    "o3-mini": "gpt-5.4-mini",
    "o1": "gpt-5.4",
    # Anthropic
    "claude-3-5-haiku-latest": "claude-haiku-4-5-20251001",
    "claude-3-5-sonnet-latest": "claude-sonnet-4-6",
    "claude-sonnet-4-20250514": "claude-sonnet-4-6",
    "claude-opus-4-20250514": "claude-opus-4-6",
    "claude-3-opus-latest": "claude-opus-4-7",
    "claude-opus-latest": "claude-opus-4-7",
    "claude-sonnet-latest": "claude-sonnet-4-6",
    "claude-haiku-latest": "claude-haiku-4-5-20251001",
    # Google
    "gemini-1.5-pro": "gemini-3.1-pro-preview",
    "gemini-1.5-flash": "gemini-3-flash-preview",
    "gemini-2.0-flash": "gemini-3-flash-preview",
    "gemini-2.0-flash-lite": "gemini-3.1-flash-lite-preview",
    "gemini-2.5-pro": "gemini-3.1-pro-preview",
    "gemini-2.5-flash": "gemini-3-flash-preview",
    "gemini-2.5-flash-lite": "gemini-3.1-flash-lite-preview",
    "gemini-3-pro-preview": "gemini-3.1-pro-preview",
    "gemini-exp-1206": "gemini-3-flash-preview",
    # xAI — note: canonical xAI API IDs use dashes (grok-4-20, not grok-4.20)
    "grok-beta": "grok-4-20",
    "grok-2": "grok-4-20",
    "grok-2-mini": "grok-4-1-fast-non-reasoning",
    "grok-3": "grok-4-20",
    "grok-4.20": "grok-4-20",
    "grok-4-20-reasoning": "grok-4-20",
    "grok-4-20-non-reasoning": "grok-4-1-fast-non-reasoning",
    # Groq
    "mixtral-8x7b-32768": "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile": "llama-3.3-70b-versatile",
    # OpenRouter — older free-tier IDs forwarded to current free models
    # (verified Apr 25 2026: original IDs no longer in OpenRouter free roster)
    "meta-llama/llama-3.3-70b-instruct:free": "qwen/qwen3-coder:free",
    "google/gemma-2-9b-it:free": "google/gemma-4-26b-a4b-it:free",
    "mistralai/mistral-7b-instruct:free": "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-4-340b-instruct:free": "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen-2.5-72b-instruct:free": "qwen/qwen3-coder:free",
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


# Free-tier fallback: when a user has no BYOK keys set, the engine
# routes through Groq's free tier (community access) with these
# models. Used by the free-tier-fallback feature (Phase 2).
FREE_FALLBACK_MODELS = {
    "debater": "llama-3.1-8b-instant",
    "judge": "llama-3.3-70b-versatile",
}

FREE_FALLBACK_PROVIDER = "groq"


def get_free_fallback_models(count: int = 2) -> list[str]:
    return [FREE_FALLBACK_MODELS["debater"]] * count


def get_free_fallback_judge() -> str:
    return FREE_FALLBACK_MODELS["judge"]

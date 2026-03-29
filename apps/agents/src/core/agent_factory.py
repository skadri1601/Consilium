import os

from ..shared.config.settings import settings
from ..features.agents.base_agent import BaseAgent
from ..features.agents.openai_agent import OpenAIAgent
from ..features.agents.anthropic_agent import AnthropicAgent
from ..features.agents.google_agent import GoogleAgent
from ..features.agents.groq_agent import GroqAgent
from ..features.agents.xai_agent import XAIAgent
from ..shared.config.models import (
    get_provider_for_model,
    FREE_FALLBACK_MODELS,
    FREE_FALLBACK_PROVIDER,
    get_free_fallback_judge,
)


PROVIDER_AGENT_MAP: dict[str, type[BaseAgent]] = {
    "openai": OpenAIAgent,
    "anthropic": AnthropicAgent,
    "google": GoogleAgent,
    "groq": GroqAgent,
    "xai": XAIAgent,
}

PROVIDER_KEY_FIELD: dict[str, list[str]] = {
    "openai": ["openaiKey", "openai_key", "openai"],
    "anthropic": ["anthropicKey", "anthropic_key", "anthropic"],
    "google": ["googleKey", "google_key", "google"],
    "groq": ["groqKey", "groq_key", "groq"],
    "xai": ["xaiKey", "xai_key", "xai"],
}

PROVIDER_ENV_VARS: dict[str, list[str]] = {
    "openai": ["OPENAI_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY"],
    "google": ["GOOGLE_API_KEY"],
    "groq": ["GROQ_API_KEY", "GROQ_PLATFORM_KEY"],
    "xai": ["XAI_API_KEY"],
}


def _resolve_env_key(provider: str) -> str | None:
    settings_keys = {
        "openai": settings.openai_api_key,
        "anthropic": settings.anthropic_api_key,
        "google": settings.google_api_key,
        "groq": settings.groq_api_key,
        "xai": settings.xai_api_key,
    }
    key = settings_keys.get(provider)
    if key:
        return key
    for var in PROVIDER_ENV_VARS.get(provider, []):
        val = os.getenv(var)
        if val:
            return val
    return None


def _extract_user_key(provider: str, api_keys: dict[str, str | None]) -> str | None:
    for field in PROVIDER_KEY_FIELD.get(provider, []):
        val = api_keys.get(field)
        if val:
            return val
    return None


def _has_any_user_key(api_keys: dict[str, str | None]) -> bool:
    return any(v for v in api_keys.values() if v)


class AgentFactory:

    @staticmethod
    def create(model_id: str, api_keys: dict[str, str | None]) -> BaseAgent:
        provider = get_provider_for_model(model_id)
        if provider is None:
            raise ValueError(f"Unknown model: {model_id}")

        agent_cls = PROVIDER_AGENT_MAP.get(provider)
        if agent_cls is None:
            raise ValueError(f"No agent implementation for provider: {provider}")

        env_key = _resolve_env_key(provider)
        user_key = _extract_user_key(provider, api_keys)
        api_key = env_key or user_key

        import sys
        print(f"[AgentFactory] model={model_id} provider={provider} env_key={(env_key or 'NONE')[:15]} user_key={(user_key or 'NONE')[:15]} final={(api_key or 'NONE')[:15]}", file=sys.stderr)

        return agent_cls(model_id=model_id, api_key=api_key)

    @staticmethod
    def create_fallback_debater(api_keys: dict[str, str | None]) -> tuple[BaseAgent, str]:
        platform_key = _resolve_env_key("groq")
        if not platform_key:
            raise ValueError("No API keys available and no platform fallback configured")
        model_id = FREE_FALLBACK_MODELS["debater"]
        agent = GroqAgent(model_id=model_id, api_key=platform_key)
        return agent, model_id

    @staticmethod
    def create_fallback_judge() -> tuple[BaseAgent, str]:
        platform_key = _resolve_env_key("groq")
        if not platform_key:
            raise ValueError("No platform Groq key for fallback judge")
        model_id = get_free_fallback_judge()
        agent = GroqAgent(model_id=model_id, api_key=platform_key)
        return agent, model_id

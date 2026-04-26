import os

from ..shared.config.settings import settings
from ..features.agents.base_agent import BaseAgent
from ..features.agents.openai_agent import OpenAIAgent
from ..features.agents.anthropic_agent import AnthropicAgent
from ..features.agents.google_agent import GoogleAgent
from ..features.agents.groq_agent import GroqAgent
from ..features.agents.xai_agent import XAIAgent
from ..features.agents.moonshot_agent import MoonshotAgent
from ..features.agents.openrouter_agent import OpenRouterAgent
from ..features.free_tier import FreeTierResolver, ModelResolution
from ..features.free_tier.resolver import NoKeyAvailableError
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
    "moonshot": MoonshotAgent,
    "openrouter": OpenRouterAgent,
}

PROVIDER_KEY_FIELD: dict[str, list[str]] = {
    "openai": ["openaiKey", "openai_key", "openai"],
    "anthropic": ["anthropicKey", "anthropic_key", "anthropic"],
    "google": ["googleKey", "google_key", "google"],
    "groq": ["groqKey", "groq_key", "groq"],
    "xai": ["xaiKey", "xai_key", "xai"],
    "moonshot": ["moonshotKey", "moonshot_key", "moonshot"],
    "openrouter": ["openrouterKey", "openrouter_key", "openrouter"],
}

PROVIDER_ENV_VARS: dict[str, list[str]] = {
    "openai": ["OPENAI_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY"],
    "google": ["GOOGLE_API_KEY"],
    "groq": ["GROQ_API_KEY", "GROQ_PLATFORM_KEY"],
    "xai": ["XAI_API_KEY"],
    "moonshot": ["MOONSHOT_API_KEY"],
    "openrouter": ["OPENROUTER_API_KEY"],
}


def _resolve_env_key(provider: str) -> str | None:
    settings_keys = {
        "openai": getattr(settings, "openai_api_key", None),
        "anthropic": getattr(settings, "anthropic_api_key", None),
        "google": getattr(settings, "google_api_key", None),
        "groq": getattr(settings, "groq_api_key", None),
        "xai": getattr(settings, "xai_api_key", None),
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


# Process-wide resolver. Cheap to construct; one instance lets the
# audit log aggregate fallbacks across concurrent debates for ops
# visibility.
_resolver = FreeTierResolver()


class AgentFactory:

    @staticmethod
    def create(
        model_id: str,
        api_keys: dict[str, str | None],
        *,
        allow_free_tier_fallback: bool = True,
    ) -> BaseAgent:
        """Create an agent for ``model_id``.

        Resolution order (see free_tier.resolver for details):
        1. BYOK for the model's provider in ``api_keys``
        2. Self-hosted env var (OPENAI_API_KEY, etc.)
        3. Free-tier pool: Groq (CONSILIUM_FREE_TIER_GROQ_KEY) with a
           tier-equivalent Llama / GPT-OSS model
        4. Free-tier pool: OpenRouter (CONSILIUM_FREE_TIER_OPENROUTER_KEY)
        """
        if allow_free_tier_fallback:
            try:
                resolution = _resolver.resolve(model_id, api_keys)
                return AgentFactory.create_from_resolution(resolution)
            except NoKeyAvailableError:
                # Fall through to the legacy-path error below so existing
                # callers that expect ``ValueError`` / ``LLMProviderError``
                # semantics don't break.
                pass

        # Legacy direct path — keep so tests that don't set the free-tier
        # envs still behave as before.
        provider = get_provider_for_model(model_id)
        if provider is None:
            raise ValueError(f"Unknown model: {model_id}")
        agent_cls = PROVIDER_AGENT_MAP.get(provider)
        if agent_cls is None:
            raise ValueError(f"No agent implementation for provider: {provider}")
        env_key = _resolve_env_key(provider)
        user_key = _extract_user_key(provider, api_keys)
        api_key = env_key or user_key
        return agent_cls(model_id=model_id, api_key=api_key)

    @staticmethod
    def create_from_resolution(resolution: ModelResolution) -> BaseAgent:
        agent_cls = PROVIDER_AGENT_MAP.get(resolution.effective_provider)
        if agent_cls is None:
            raise ValueError(
                f"No agent implementation for provider: {resolution.effective_provider}"
            )
        return agent_cls(
            model_id=resolution.effective_model,
            api_key=resolution.effective_api_key,
        )

    @staticmethod
    def resolve(
        model_id: str,
        api_keys: dict[str, str | None],
    ) -> ModelResolution:
        """Expose the resolver to callers that need the resolution metadata
        (e.g. to emit routing:fallback SSE events before constructing the agent)."""
        return _resolver.resolve(model_id, api_keys)

    @staticmethod
    def resolver_audit() -> list[ModelResolution]:
        """Recent resolver decisions, useful for observability + tests."""
        return _resolver.audit()

    @staticmethod
    def create_fallback_debater(api_keys: dict[str, str | None]) -> tuple[BaseAgent, str]:
        platform_key = os.getenv("CONSILIUM_FREE_TIER_GROQ_KEY") or _resolve_env_key("groq")
        if not platform_key:
            raise ValueError("No API keys available and no platform fallback configured")
        model_id = FREE_FALLBACK_MODELS["debater"]
        agent = GroqAgent(model_id=model_id, api_key=platform_key)
        return agent, model_id

    @staticmethod
    def create_fallback_judge() -> tuple[BaseAgent, str]:
        platform_key = os.getenv("CONSILIUM_FREE_TIER_GROQ_KEY") or _resolve_env_key("groq")
        if not platform_key:
            raise ValueError("No platform Groq key for fallback judge")
        model_id = get_free_fallback_judge()
        agent = GroqAgent(model_id=model_id, api_key=platform_key)
        return agent, model_id

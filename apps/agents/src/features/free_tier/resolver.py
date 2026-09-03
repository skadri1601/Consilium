"""Free-tier resolver.

Given a user's requested model and the keys they supplied, return the
(model_id, api_key, provider) tuple the engine should actually use.

Resolution order:
1. If the user has a BYOK for the requested model's provider, use it
   (no fallback).
2. If Consilium's own env-var key for that provider is present
   (self-hosted scenario), use it (still no fallback).
3. Otherwise, fall back to Consilium's free-tier pool:
   a. Groq with a tier-equivalent Llama / GPT-OSS model, if
      CONSILIUM_FREE_TIER_GROQ_KEY is set.
   b. OpenRouter with a tier-equivalent free model, if
      CONSILIUM_FREE_TIER_OPENROUTER_KEY is set.
4. If neither platform key is configured, raise.

The resolver is deliberately pure - it neither imports the heavy
agent classes nor opens HTTP connections. That keeps it fast to test.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Optional

from src.shared.config.models import (
    AVAILABLE_MODELS,
    MODEL_ALIASES,
    get_provider_for_model,
)

logger = logging.getLogger(__name__)


# Env vars the Consilium platform uses to fund the free-tier pool.
# These are distinct from the standard GROQ_API_KEY / OPENAI_API_KEY
# etc. so operators can separate "fallback pool" credentials from
# "self-hosted single-tenant" credentials.
FREE_TIER_ENV_VARS = {
    "groq": "CONSILIUM_FREE_TIER_GROQ_KEY",
    "openrouter": "CONSILIUM_FREE_TIER_OPENROUTER_KEY",
}


# When a user asks for a specific tier of model on one provider but
# has no key, we route to a tier-equivalent free model. Tiers come
# from the CLI catalog: fast / balanced / deep. The preferred free
# target is Groq; OpenRouter is the backup.
TIER_EQUIVALENT_FREE_MODELS: dict[str, dict[str, str]] = {
    "groq": {
        "fast": "llama-3.1-8b-instant",
        "balanced": "llama-3.3-70b-versatile",
        "deep": "openai/gpt-oss-120b",
    },
    "openrouter": {
        "fast": "google/gemma-4-26b-a4b-it:free",
        "balanced": "google/gemma-4-31b-it:free",
        "deep": "nvidia/nemotron-3-super-120b-a12b:free",
    },
}


# Known BYOK key field aliases, same shape AgentFactory uses today.
PROVIDER_KEY_FIELDS: dict[str, list[str]] = {
    "openai": ["openaiKey", "openai_key", "openai"],
    "anthropic": ["anthropicKey", "anthropic_key", "anthropic"],
    "google": ["googleKey", "google_key", "google"],
    "groq": ["groqKey", "groq_key", "groq"],
    "xai": ["xaiKey", "xai_key", "xai"],
    "moonshot": ["moonshotKey", "moonshot_key", "moonshot"],
    "openrouter": ["openrouterKey", "openrouter_key", "openrouter"],
}


# Standard env vars (for self-hosted deployments where the operator
# pre-configures their own provider keys without going through the
# platform-pool env vars).
PROVIDER_ENV_VARS: dict[str, list[str]] = {
    "openai": ["OPENAI_API_KEY"],
    "anthropic": ["ANTHROPIC_API_KEY"],
    "google": ["GOOGLE_API_KEY"],
    "groq": ["GROQ_API_KEY", "GROQ_PLATFORM_KEY"],
    "xai": ["XAI_API_KEY"],
    "moonshot": ["MOONSHOT_API_KEY"],
    "openrouter": ["OPENROUTER_API_KEY"],
}


@dataclass
class ModelResolution:
    """The outcome of resolving a requested model against available keys."""

    requested_model: str
    requested_provider: Optional[str]
    effective_model: str
    effective_provider: str
    effective_api_key: str
    is_fallback: bool
    fallback_reason: Optional[str] = None

    def to_event_payload(self) -> dict:
        """Shape suitable for the routing:fallback SSE event.

        Deliberately omits the API key so we never leak credentials
        into the event stream.
        """
        return {
            "requested_model": self.requested_model,
            "requested_provider": self.requested_provider,
            "effective_model": self.effective_model,
            "effective_provider": self.effective_provider,
            "is_fallback": self.is_fallback,
            "fallback_reason": self.fallback_reason,
        }


def _catalog_tier(model_id: str) -> str:
    """Best-effort tier lookup. Defaults to 'balanced' for unknowns."""
    for provider_models in AVAILABLE_MODELS.values():
        for m in provider_models:
            if m["id"] == model_id:
                # AVAILABLE_MODELS doesn't carry tier today; infer from cost.
                in_cost = m.get("input_cost", 0.0)
                if in_cost >= 3.0:
                    return "deep"
                if in_cost >= 0.5:
                    return "balanced"
                return "fast"
    return "balanced"


def _extract_user_key(provider: str, api_keys: dict) -> Optional[str]:
    for field in PROVIDER_KEY_FIELDS.get(provider, []):
        val = api_keys.get(field)
        if val:
            return val
    return None


def _env_key(var_names: list[str]) -> Optional[str]:
    for v in var_names:
        val = os.getenv(v)
        if val:
            return val
    return None


def _free_tier_env_key(provider: str) -> Optional[str]:
    env_var = FREE_TIER_ENV_VARS.get(provider)
    if not env_var:
        return None
    return os.getenv(env_var)


class FreeTierResolver:
    """Resolves (requested model, user keys) -> actual (model, key, provider).

    Keeps a light in-memory audit log (last ~100 resolutions) so tests
    and the web UI can observe fallback decisions.
    """

    def __init__(self, audit_limit: int = 100):
        self._audit: list[ModelResolution] = []
        self._audit_limit = audit_limit

    def resolve(
        self,
        requested_model: str,
        api_keys: dict | None = None,
    ) -> ModelResolution:
        api_keys = api_keys or {}

        resolved_model = MODEL_ALIASES.get(requested_model, requested_model)
        requested_provider = get_provider_for_model(resolved_model)

        # 1. BYOK path
        if requested_provider is not None:
            user_key = _extract_user_key(requested_provider, api_keys)
            if user_key:
                return self._record(
                    ModelResolution(
                        requested_model=requested_model,
                        requested_provider=requested_provider,
                        effective_model=resolved_model,
                        effective_provider=requested_provider,
                        effective_api_key=user_key,
                        is_fallback=False,
                    )
                )

            env_provider_key = _env_key(PROVIDER_ENV_VARS.get(requested_provider, []))
            if env_provider_key:
                return self._record(
                    ModelResolution(
                        requested_model=requested_model,
                        requested_provider=requested_provider,
                        effective_model=resolved_model,
                        effective_provider=requested_provider,
                        effective_api_key=env_provider_key,
                        is_fallback=False,
                    )
                )

        # 2. Free-tier fallback: tier-equivalent free model on Groq
        tier = _catalog_tier(resolved_model)
        groq_key = _free_tier_env_key("groq")
        if groq_key:
            free_model = TIER_EQUIVALENT_FREE_MODELS["groq"][tier]
            reason = self._reason(requested_model, requested_provider, free_model, "groq")
            return self._record(
                ModelResolution(
                    requested_model=requested_model,
                    requested_provider=requested_provider,
                    effective_model=free_model,
                    effective_provider="groq",
                    effective_api_key=groq_key,
                    is_fallback=True,
                    fallback_reason=reason,
                )
            )

        # 3. OpenRouter backup
        openrouter_key = _free_tier_env_key("openrouter")
        if openrouter_key:
            free_model = TIER_EQUIVALENT_FREE_MODELS["openrouter"][tier]
            reason = self._reason(requested_model, requested_provider, free_model, "openrouter")
            return self._record(
                ModelResolution(
                    requested_model=requested_model,
                    requested_provider=requested_provider,
                    effective_model=free_model,
                    effective_provider="openrouter",
                    effective_api_key=openrouter_key,
                    is_fallback=True,
                    fallback_reason=reason,
                )
            )

        raise NoKeyAvailableError(
            f"No BYOK for {requested_provider or 'unknown provider'} and no "
            f"free-tier pool configured. Set {FREE_TIER_ENV_VARS['groq']} or "
            f"{FREE_TIER_ENV_VARS['openrouter']}, or supply a {requested_provider} key."
        )

    def audit(self) -> list[ModelResolution]:
        return list(self._audit)

    def _record(self, resolution: ModelResolution) -> ModelResolution:
        self._audit.append(resolution)
        if len(self._audit) > self._audit_limit:
            self._audit = self._audit[-self._audit_limit :]
        if resolution.is_fallback:
            logger.info(
                "Free-tier fallback: %s -> %s (%s)",
                resolution.requested_model,
                resolution.effective_model,
                resolution.effective_provider,
            )
        return resolution

    @staticmethod
    def _reason(
        requested_model: str,
        requested_provider: Optional[str],
        fallback_model: str,
        fallback_provider: str,
    ) -> str:
        if requested_provider:
            return (
                f"No {requested_provider} API key configured. Routed "
                f"{requested_model} to {fallback_provider} free tier "
                f"({fallback_model}). Set your own {requested_provider} key "
                f"to use the requested model."
            )
        return (
            f"No key for unknown provider of {requested_model}. Routed to "
            f"{fallback_provider} free tier ({fallback_model})."
        )


class NoKeyAvailableError(RuntimeError):
    """Raised when neither BYOK nor free-tier pool can satisfy a request."""

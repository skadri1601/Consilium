"""Tests for FreeTierResolver resolution order and fallback semantics."""

from __future__ import annotations

import pytest

from src.features.free_tier.resolver import (
    FREE_TIER_ENV_VARS,
    FreeTierResolver,
    ModelResolution,
    NoKeyAvailableError,
    TIER_EQUIVALENT_FREE_MODELS,
    _catalog_tier,
)


PROVIDER_ENV_VARS_TO_CLEAR = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_API_KEY",
    "GROQ_API_KEY",
    "GROQ_PLATFORM_KEY",
    "XAI_API_KEY",
    "MOONSHOT_API_KEY",
    "OPENROUTER_API_KEY",
    "CONSILIUM_FREE_TIER_GROQ_KEY",
    "CONSILIUM_FREE_TIER_OPENROUTER_KEY",
]


@pytest.fixture(autouse=True)
def _isolated_env(monkeypatch):
    for var in PROVIDER_ENV_VARS_TO_CLEAR:
        monkeypatch.delenv(var, raising=False)
    yield


@pytest.fixture
def resolver():
    return FreeTierResolver()


class TestBYOKPath:
    def test_byok_returns_user_key_without_fallback(self, resolver):
        resolution = resolver.resolve(
            "gpt-5.4",
            {"openaiKey": "sk-user-key"},
        )
        assert resolution.effective_api_key == "sk-user-key"
        assert resolution.effective_provider == "openai"
        assert resolution.effective_model == "gpt-5.4"
        assert resolution.is_fallback is False
        assert resolution.fallback_reason is None

    def test_byok_recognises_alternate_field_names(self, resolver):
        resolution = resolver.resolve(
            "claude-sonnet-4-6",
            {"anthropic_key": "sk-ant-user"},
        )
        assert resolution.effective_api_key == "sk-ant-user"
        assert resolution.effective_provider == "anthropic"
        assert resolution.is_fallback is False

    def test_byok_resolves_alias_to_current_model(self, resolver):
        resolution = resolver.resolve(
            "gpt-4o",
            {"openaiKey": "sk-user-key"},
        )
        assert resolution.requested_model == "gpt-4o"
        assert resolution.effective_model == "gpt-5.4"
        assert resolution.is_fallback is False


class TestSelfHostedEnvPath:
    def test_env_var_used_when_no_byok(self, resolver, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "sk-env-key")
        resolution = resolver.resolve("gpt-5.4", {})
        assert resolution.effective_api_key == "sk-env-key"
        assert resolution.effective_provider == "openai"
        assert resolution.is_fallback is False

    def test_byok_wins_over_env(self, resolver, monkeypatch):
        monkeypatch.setenv("OPENAI_API_KEY", "sk-env-key")
        resolution = resolver.resolve(
            "gpt-5.4",
            {"openaiKey": "sk-user-key"},
        )
        assert resolution.effective_api_key == "sk-user-key"
        assert resolution.is_fallback is False


class TestGroqFreeTierFallback:
    def test_balanced_tier_routes_to_llama_70b(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk-platform")
        resolution = resolver.resolve("claude-haiku-4-5-20251001", {})
        assert resolution.is_fallback is True
        assert resolution.effective_provider == "groq"
        assert resolution.effective_model == "llama-3.3-70b-versatile"
        assert resolution.effective_api_key == "gsk-platform"
        assert resolution.requested_provider == "anthropic"
        assert "anthropic" in (resolution.fallback_reason or "")

    def test_deep_tier_routes_to_gpt_oss_120b(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk-platform")
        resolution = resolver.resolve("gpt-5.5-pro", {})
        assert resolution.is_fallback is True
        assert resolution.effective_model == "openai/gpt-oss-120b"
        assert resolution.effective_provider == "groq"

    def test_fast_tier_routes_to_llama_8b(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk-platform")
        resolution = resolver.resolve("gpt-5.4-nano", {})
        assert resolution.is_fallback is True
        assert resolution.effective_model == "llama-3.1-8b-instant"

    def test_byok_still_wins_over_free_tier(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk-platform")
        resolution = resolver.resolve(
            "gpt-5.4",
            {"openaiKey": "sk-user"},
        )
        assert resolution.is_fallback is False
        assert resolution.effective_api_key == "sk-user"


class TestOpenRouterFallback:
    def test_openrouter_used_when_groq_unavailable(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_OPENROUTER_KEY", "or-platform")
        resolution = resolver.resolve("claude-haiku-4-5-20251001", {})
        assert resolution.is_fallback is True
        assert resolution.effective_provider == "openrouter"
        assert resolution.effective_model == "google/gemma-4-31b-it:free"
        assert resolution.effective_api_key == "or-platform"

    def test_groq_preferred_over_openrouter(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk-platform")
        monkeypatch.setenv("CONSILIUM_FREE_TIER_OPENROUTER_KEY", "or-platform")
        resolution = resolver.resolve("claude-haiku-4-5-20251001", {})
        assert resolution.effective_provider == "groq"


class TestNoKeyAvailable:
    def test_raises_when_no_keys_configured(self, resolver):
        with pytest.raises(NoKeyAvailableError):
            resolver.resolve("gpt-5.4", {})

    def test_error_mentions_env_var_names(self, resolver):
        with pytest.raises(NoKeyAvailableError) as exc_info:
            resolver.resolve("gpt-5.4", {})
        msg = str(exc_info.value)
        assert FREE_TIER_ENV_VARS["groq"] in msg
        assert FREE_TIER_ENV_VARS["openrouter"] in msg


class TestTierInference:
    def test_deep_tier_from_expensive_model(self):
        assert _catalog_tier("gpt-5.5-pro") == "deep"

    def test_balanced_tier_from_midrange_model(self):
        assert _catalog_tier("claude-haiku-4-5-20251001") == "balanced"

    def test_fast_tier_from_cheap_model(self):
        assert _catalog_tier("gpt-5.4-nano") == "fast"

    def test_unknown_model_defaults_to_balanced(self):
        assert _catalog_tier("made-up-model-xyz") == "balanced"


class TestAuditLog:
    def test_audit_captures_resolutions(self, resolver):
        resolver.resolve("gpt-5.4", {"openaiKey": "sk-u"})
        resolver.resolve("claude-sonnet-4-6", {"anthropicKey": "sk-a"})
        audit = resolver.audit()
        assert len(audit) == 2
        assert audit[0].effective_model == "gpt-5.4"
        assert audit[1].effective_model == "claude-sonnet-4-6"

    def test_audit_is_capped(self, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk")
        resolver = FreeTierResolver(audit_limit=3)
        for _ in range(5):
            resolver.resolve("gpt-5.4", {})
        assert len(resolver.audit()) == 3


class TestEventPayload:
    def test_payload_omits_api_key(self, resolver, monkeypatch):
        monkeypatch.setenv("CONSILIUM_FREE_TIER_GROQ_KEY", "gsk-secret")
        resolution = resolver.resolve("claude-sonnet-4-6", {})
        payload = resolution.to_event_payload()
        assert "effective_api_key" not in payload
        assert "gsk-secret" not in str(payload)
        assert payload["is_fallback"] is True
        assert payload["effective_provider"] == "groq"
        assert payload["requested_model"] == "claude-sonnet-4-6"


class TestTierEquivalenceMap:
    def test_all_tiers_present_per_provider(self):
        for provider in ("groq", "openrouter"):
            for tier in ("fast", "balanced", "deep"):
                assert tier in TIER_EQUIVALENT_FREE_MODELS[provider]
                assert TIER_EQUIVALENT_FREE_MODELS[provider][tier]

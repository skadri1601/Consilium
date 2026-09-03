"""Tests for free-tier pool visibility on the agents health endpoints."""

from __future__ import annotations

import pytest

from src.features.free_tier.resolver import (
    FREE_TIER_ENV_VARS,
    TIER_EQUIVALENT_FREE_MODELS,
)
from src.features.health.router import (
    check_free_tier_pool,
    get_free_tier_status,
    health_check,
    providers_status,
    readiness_check,
)


ALL_KEY_ENV_VARS = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GOOGLE_API_KEY",
    "GROQ_API_KEY",
    "XAI_API_KEY",
    "MOONSHOT_API_KEY",
    "OPENROUTER_API_KEY",
    *FREE_TIER_ENV_VARS.values(),
]


@pytest.fixture
def no_keys(monkeypatch):
    for var in ALL_KEY_ENV_VARS:
        monkeypatch.delenv(var, raising=False)
    return monkeypatch


def test_pool_reports_every_known_provider(no_keys):
    assert set(check_free_tier_pool()) == set(FREE_TIER_ENV_VARS)


def test_pool_unfunded_when_no_env_keys(no_keys):
    status = get_free_tier_status()
    assert status["configured"] is False
    assert status["models"] == {}


def test_pool_funded_lists_tier_models(no_keys):
    no_keys.setenv(FREE_TIER_ENV_VARS["groq"], "gsk_test")
    status = get_free_tier_status()
    assert status["configured"] is True
    assert status["providers"]["groq"] is True
    assert status["providers"]["openrouter"] is False
    assert status["models"]["groq"] == TIER_EQUIVALENT_FREE_MODELS["groq"]
    assert "openrouter" not in status["models"]


@pytest.mark.asyncio
async def test_health_degraded_without_keys_or_pool(no_keys):
    result = await health_check()
    assert result["status"] == "degraded"
    assert result["free_tier"]["configured"] is False
    assert result["warnings"]


@pytest.mark.asyncio
async def test_health_healthy_on_pool_alone(no_keys):
    no_keys.setenv(FREE_TIER_ENV_VARS["openrouter"], "sk-or-test")
    result = await health_check()
    assert result["status"] == "healthy"
    assert result["free_tier"]["configured"] is True
    assert any("free-tier pool" in w for w in result["warnings"])


@pytest.mark.asyncio
async def test_health_no_warnings_with_provider_key(no_keys):
    no_keys.setenv("GROQ_API_KEY", "gsk_byok")
    result = await health_check()
    assert result["status"] == "healthy"
    assert result["warnings"] == []


@pytest.mark.asyncio
async def test_ready_on_pool_alone(no_keys):
    no_keys.setenv(FREE_TIER_ENV_VARS["groq"], "gsk_test")
    result = await readiness_check()
    assert result["status"] == "ready"
    assert result["checks"]["api_keys"] is False
    assert result["checks"]["free_tier_pool"] is True


@pytest.mark.asyncio
async def test_not_ready_without_keys_or_pool(no_keys):
    result = await readiness_check()
    assert result["status"] == "not_ready"
    assert result["checks"]["free_tier_pool"] is False


@pytest.mark.asyncio
async def test_providers_endpoint_exposes_pool(no_keys):
    no_keys.setenv(FREE_TIER_ENV_VARS["groq"], "gsk_test")
    result = await providers_status()
    assert result["free_tier"]["configured"] is True
    assert result["free_tier"]["env_vars"] == FREE_TIER_ENV_VARS

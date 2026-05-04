"""Tests for the deterministic mock agent."""

import pytest

from src.features.agents.base_agent import LLMProviderError
from src.features.agents.mock_agent import (
    MOCK_MODEL_PREFIX,
    MOCK_PROVIDER,
    MockAgent,
)
from src.core.agent_factory import AgentFactory
from src.shared.config.models import get_provider_for_model


@pytest.mark.asyncio
async def test_aligned_scenario_returns_text():
    agent = MockAgent("mock-aligned")
    text, tokens = await agent.generate_response("anything")
    assert "agree" in text.lower()
    assert tokens > 0


@pytest.mark.asyncio
async def test_short_scenario_returns_below_minimum():
    agent = MockAgent("mock-short")
    text, _ = await agent.generate_response("ping")
    assert len(text) < 20


@pytest.mark.asyncio
async def test_empty_scenario_returns_empty_text():
    agent = MockAgent("mock-empty")
    text, tokens = await agent.generate_response("ping")
    assert text == ""
    assert tokens == 0


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "model_id,expected_type",
    [
        ("mock-rate-limit", "rate_limit"),
        ("mock-auth", "auth"),
        ("mock-timeout", "timeout"),
        ("mock-server-error", "server_error"),
        ("mock-context-overflow", "server_error"),
    ],
)
async def test_error_scenarios_raise_classified_provider_error(model_id, expected_type):
    agent = MockAgent(model_id)
    with pytest.raises(LLMProviderError) as exc:
        await agent.generate_response("ping")
    assert exc.value.error_type == expected_type
    assert exc.value.provider == MOCK_PROVIDER


@pytest.mark.asyncio
async def test_stream_response_yields_text_in_chunks():
    agent = MockAgent("mock-aligned")
    chunks = [c async for c in agent.stream_response("ping")]
    assert "".join(chunks) == agent._scenario["text"]
    assert len(chunks) >= 1


@pytest.mark.asyncio
async def test_stream_response_empty_scenario_yields_nothing():
    agent = MockAgent("mock-empty")
    chunks = [c async for c in agent.stream_response("ping")]
    assert chunks == []


def test_unknown_scenario_raises():
    with pytest.raises(ValueError, match="unknown mock scenario"):
        MockAgent("mock-not-a-scenario")


def test_non_mock_model_id_rejected():
    with pytest.raises(ValueError, match="mock-"):
        MockAgent("gpt-5.4")


def test_list_scenarios_round_trips():
    ids = MockAgent.list_scenarios()
    assert all(i.startswith(MOCK_MODEL_PREFIX) for i in ids)
    for mid in ids:
        MockAgent(mid)


def test_factory_short_circuits_for_mock_models():
    agent = AgentFactory.create("mock-aligned", api_keys={}, allow_free_tier_fallback=False)
    assert isinstance(agent, MockAgent)


def test_provider_lookup_resolves_mock_models():
    assert get_provider_for_model("mock-aligned") == MOCK_PROVIDER
    assert get_provider_for_model("mock-rate-limit") == MOCK_PROVIDER


@pytest.mark.asyncio
async def test_health_check_reflects_scenario():
    assert await MockAgent("mock-aligned").health_check() is True
    assert await MockAgent("mock-rate-limit").health_check() is False

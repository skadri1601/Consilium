"""Smoke tests for Moonshot + OpenRouter adapters (OpenAI-compatible)."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.features.agents.moonshot_agent import MoonshotAgent
from src.features.agents.openrouter_agent import OpenRouterAgent
from src.features.agents.base_agent import ToolDefinition


def _assistant_msg(content: str = ""):
    message = SimpleNamespace(content=content or None, tool_calls=None)
    choice = SimpleNamespace(message=message)
    usage = SimpleNamespace(total_tokens=42)
    return SimpleNamespace(choices=[choice], usage=usage)


def _mock_client():
    client = MagicMock()
    client.chat.completions.create = AsyncMock(return_value=_assistant_msg("hello"))
    http = MagicMock()
    http.aclose = AsyncMock()
    return client, http


@pytest.fixture(autouse=True)
def keys(monkeypatch):
    monkeypatch.setenv("MOONSHOT_API_KEY", "k")
    monkeypatch.setenv("OPENROUTER_API_KEY", "k")


class TestMoonshot:
    def test_defaults(self):
        agent = MoonshotAgent()
        assert agent.provider == "Moonshot"
        assert agent.model_id == "kimi-k2.6"
        assert agent.base_url == "https://api.moonshot.ai/v1"

    def test_generate_with_tools_uses_shared_loop(self):
        async def run():
            client, http = _mock_client()
            with patch.object(MoonshotAgent, "_create_openai_client", return_value=(client, http)):
                resp = await MoonshotAgent().generate_with_tools(
                    query="x", tools=[], executor=AsyncMock()
                )
            assert resp.text == "hello"

        asyncio.run(run())


class TestOpenRouter:
    def test_defaults(self):
        agent = OpenRouterAgent()
        assert agent.provider == "OpenRouter"
        assert agent.model_id == "qwen/qwen3-coder:free"
        assert agent.base_url == "https://openrouter.ai/api/v1"

    def test_generate_with_tools_uses_shared_loop(self):
        async def run():
            client, http = _mock_client()
            with patch.object(OpenRouterAgent, "_create_openai_client", return_value=(client, http)):
                resp = await OpenRouterAgent().generate_with_tools(
                    query="x",
                    tools=[ToolDefinition(qualified_name="fs.read", description="", input_schema={})],
                    executor=AsyncMock(),
                )
            assert resp.text == "hello"

        asyncio.run(run())

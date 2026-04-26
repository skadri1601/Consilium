"""Tests for the OpenAI-compatible tool-use adapter shared by
OpenAI, Groq, and xAI agents."""

from __future__ import annotations

import asyncio
import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.features.agents.openai_agent import OpenAIAgent
from src.features.agents.groq_agent import GroqAgent
from src.features.agents.xai_agent import XAIAgent
from src.features.agents.base_agent import ToolDefinition, ToolResult


def _assistant_msg(content: str = "", tool_calls=None):
    message = SimpleNamespace(content=content or None, tool_calls=tool_calls)
    choice = SimpleNamespace(message=message)
    usage = SimpleNamespace(total_tokens=30)
    return SimpleNamespace(choices=[choice], usage=usage)


def _tool_call(call_id: str, name: str, args: dict):
    return SimpleNamespace(
        id=call_id,
        type="function",
        function=SimpleNamespace(name=name, arguments=json.dumps(args)),
    )


def _mock_client(responses):
    client = MagicMock()
    client.chat.completions.create = AsyncMock(side_effect=responses)
    http_client = MagicMock()
    http_client.aclose = AsyncMock()
    return client, http_client


@pytest.fixture(autouse=True)
def fake_keys(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("GROQ_API_KEY", "test")
    monkeypatch.setenv("XAI_API_KEY", "test")


class TestOpenAIToolUse:
    def test_text_only_response(self):
        async def run():
            client, http_client = _mock_client([_assistant_msg("hello")])
            with patch.object(OpenAIAgent, "_create_openai_client", return_value=(client, http_client)):
                resp = await OpenAIAgent().generate_with_tools(
                    query="hi",
                    tools=[],
                    executor=AsyncMock(),
                )
            assert resp.text == "hello"
            assert resp.tool_calls == []
            http_client.aclose.assert_awaited()

        asyncio.run(run())

    def test_tool_call_roundtrip(self):
        async def run():
            client, http_client = _mock_client(
                [
                    _assistant_msg(tool_calls=[_tool_call("c1", "fs.read", {"path": "x"})]),
                    _assistant_msg("file contents read"),
                ]
            )
            executor = AsyncMock(return_value=ToolResult(call_id="c1", content="ok", is_error=False))
            with patch.object(OpenAIAgent, "_create_openai_client", return_value=(client, http_client)):
                resp = await OpenAIAgent().generate_with_tools(
                    query="read x",
                    tools=[ToolDefinition(qualified_name="fs.read", description="", input_schema={})],
                    executor=executor,
                )
            assert resp.text == "file contents read"
            assert resp.tool_calls[0].arguments == {"path": "x"}
            assert client.chat.completions.create.await_count == 2
            executor.assert_awaited_once()

        asyncio.run(run())

    def test_cap_enforced(self):
        async def run():
            loop_resp = _assistant_msg(tool_calls=[_tool_call("c", "fs.read", {})])
            client, http_client = _mock_client([loop_resp] * 10)
            executor = AsyncMock(return_value=ToolResult(call_id="c", content="ok"))
            with patch.object(OpenAIAgent, "_create_openai_client", return_value=(client, http_client)):
                await OpenAIAgent().generate_with_tools(
                    query="x",
                    tools=[ToolDefinition(qualified_name="fs.read", description="", input_schema={})],
                    executor=executor,
                    max_tool_calls_per_turn=2,
                )
            assert client.chat.completions.create.await_count == 3
            assert executor.await_count == 3

        asyncio.run(run())


class TestGroqToolUse:
    def test_uses_shared_loop(self):
        async def run():
            client, http_client = _mock_client([_assistant_msg("groq answer")])
            with patch.object(GroqAgent, "_create_openai_client", return_value=(client, http_client)):
                resp = await GroqAgent().generate_with_tools(
                    query="x", tools=[], executor=AsyncMock()
                )
            assert resp.text == "groq answer"

        asyncio.run(run())


class TestXAIToolUse:
    def test_uses_shared_loop(self):
        async def run():
            client, http_client = _mock_client([_assistant_msg("grok answer")])
            with patch.object(XAIAgent, "_create_openai_client", return_value=(client, http_client)):
                resp = await XAIAgent().generate_with_tools(
                    query="x", tools=[], executor=AsyncMock()
                )
            assert resp.text == "grok answer"

        asyncio.run(run())


class TestInvalidJsonArguments:
    def test_malformed_json_falls_back_to_empty_args(self):
        async def run():
            bad_call = SimpleNamespace(
                id="bad",
                type="function",
                function=SimpleNamespace(name="fs.read", arguments="not valid json"),
            )
            client, http_client = _mock_client(
                [
                    _assistant_msg(tool_calls=[bad_call]),
                    _assistant_msg("done"),
                ]
            )
            executor = AsyncMock(return_value=ToolResult(call_id="bad", content="ok"))
            with patch.object(OpenAIAgent, "_create_openai_client", return_value=(client, http_client)):
                resp = await OpenAIAgent().generate_with_tools(
                    query="x",
                    tools=[ToolDefinition(qualified_name="fs.read", description="", input_schema={})],
                    executor=executor,
                )
            assert resp.tool_calls[0].arguments == {}

        asyncio.run(run())

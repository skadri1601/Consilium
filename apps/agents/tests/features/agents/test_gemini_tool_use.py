"""Tests for the Google Gemini tool-use adapter."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.features.agents import google_agent as google_mod
from src.features.agents.google_agent import GoogleAgent
from src.features.agents.base_agent import ToolDefinition, ToolResult


def _part(*, text=None, function_call=None):
    return SimpleNamespace(text=text, function_call=function_call)


def _function_call(name: str, args: dict):
    return SimpleNamespace(name=name, args=args)


def _candidate(parts):
    content = SimpleNamespace(parts=parts)
    return SimpleNamespace(content=content)


def _response(parts, tokens: int = 50):
    usage = SimpleNamespace(total_token_count=tokens)
    return SimpleNamespace(candidates=[_candidate(parts)], usage_metadata=usage)


def _mock_chat(responses):
    chat = MagicMock()
    chat.send_message_async = AsyncMock(side_effect=responses)
    return chat


@pytest.fixture(autouse=True)
def fake_key(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "test")


@pytest.fixture(autouse=True)
def enable_google(monkeypatch):
    # Monkeypatch the HAS_GOOGLE gate so tests run without the real genai install
    monkeypatch.setattr(google_mod, "HAS_GOOGLE", True)
    fake_genai = MagicMock()
    monkeypatch.setattr(google_mod, "genai", fake_genai)
    return fake_genai


class TestGeminiToolUse:
    def test_text_only_response(self, enable_google):
        async def run():
            chat = _mock_chat([_response([_part(text="hello gemini")])])
            fake_model = MagicMock()
            fake_model.start_chat = MagicMock(return_value=chat)
            enable_google.GenerativeModel.return_value = fake_model

            resp = await GoogleAgent().generate_with_tools(
                query="hi", tools=[], executor=AsyncMock()
            )
            assert resp.text == "hello gemini"
            assert resp.tool_calls == []

        asyncio.run(run())

    def test_function_call_loop(self, enable_google):
        async def run():
            first = _response(
                [_part(function_call=_function_call("fs.read", {"path": "x.ts"}))]
            )
            second = _response([_part(text="final answer")])
            chat = _mock_chat([first, second])
            fake_model = MagicMock()
            fake_model.start_chat = MagicMock(return_value=chat)
            enable_google.GenerativeModel.return_value = fake_model

            executor = AsyncMock(
                return_value=ToolResult(call_id="n/a", content="file body", is_error=False)
            )
            resp = await GoogleAgent().generate_with_tools(
                query="read x.ts",
                tools=[
                    ToolDefinition(
                        qualified_name="fs.read", description="", input_schema={"type": "object"}
                    )
                ],
                executor=executor,
            )

            assert resp.text == "final answer"
            assert len(resp.tool_calls) == 1
            assert resp.tool_calls[0].name == "fs.read"
            assert resp.tool_calls[0].arguments == {"path": "x.ts"}
            # Second send_message_async should receive function_response parts
            second_call_arg = chat.send_message_async.await_args_list[1].args[0]
            assert second_call_arg[0]["function_response"]["name"] == "fs.read"

        asyncio.run(run())

    def test_cap_enforced(self, enable_google):
        async def run():
            looping = _response(
                [_part(function_call=_function_call("fs.read", {}))]
            )
            chat = _mock_chat([looping] * 10)
            fake_model = MagicMock()
            fake_model.start_chat = MagicMock(return_value=chat)
            enable_google.GenerativeModel.return_value = fake_model

            executor = AsyncMock(return_value=ToolResult(call_id="n/a", content="ok"))
            await GoogleAgent().generate_with_tools(
                query="x",
                tools=[
                    ToolDefinition(
                        qualified_name="fs.read", description="", input_schema={}
                    )
                ],
                executor=executor,
                max_tool_calls_per_turn=2,
            )
            assert chat.send_message_async.await_count == 3
            assert executor.await_count == 3

        asyncio.run(run())

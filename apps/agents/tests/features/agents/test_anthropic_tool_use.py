"""Tests for the Anthropic tool-use adapter (Stage 1c, Anthropic-only)."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.features.agents.anthropic_agent import AnthropicAgent
from src.features.agents.base_agent import (
    ToolCall,
    ToolDefinition,
    ToolResult,
)


def _text_block(text: str):
    return SimpleNamespace(type="text", text=text)


def _tool_use_block(call_id: str, name: str, args: dict):
    block = MagicMock()
    block.type = "tool_use"
    block.id = call_id
    block.name = name
    block.input = args
    block.model_dump.return_value = {
        "type": "tool_use",
        "id": call_id,
        "name": name,
        "input": args,
    }
    return block


def _response(content: list, stop_reason: str, in_tokens: int = 10, out_tokens: int = 20):
    usage = SimpleNamespace(input_tokens=in_tokens, output_tokens=out_tokens)
    return SimpleNamespace(content=content, stop_reason=stop_reason, usage=usage)


@pytest.fixture(autouse=True)
def fake_api_key(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test_key")


def _agent() -> AnthropicAgent:
    return AnthropicAgent(model_id="claude-haiku-4-5-20251001")


def _make_mock_client():
    mock_client = MagicMock()
    mock_client.close = AsyncMock()
    return mock_client


class TestAnthropicToolUse:
    def test_returns_text_when_model_uses_no_tools(self):
        async def run():
            mock_client = _make_mock_client()
            mock_client.messages.create = AsyncMock(
                return_value=_response([_text_block("hello world")], stop_reason="end_turn")
            )
            mock_client.close = AsyncMock()
            executor = AsyncMock()

            with patch("anthropic.AsyncAnthropic", return_value=mock_client):
                resp = await _agent().generate_with_tools(
                    query="hi",
                    tools=[],
                    executor=executor,
                )

            assert resp.text == "hello world"
            assert resp.tool_calls == []
            assert resp.tokens == 30
            executor.assert_not_awaited()

        asyncio.run(run())

    def test_invokes_executor_for_tool_use_block_then_continues(self):
        async def run():
            mock_client = _make_mock_client()
            first = _response(
                [_tool_use_block("call_a", "filesystem.read_file", {"path": "x.ts"})],
                stop_reason="tool_use",
            )
            second = _response([_text_block("the file says hello")], stop_reason="end_turn")
            mock_client.messages.create = AsyncMock(side_effect=[first, second])
            mock_client.close = AsyncMock()

            executor = AsyncMock(
                return_value=ToolResult(call_id="call_a", content="export const X=1", is_error=False)
            )

            with patch("anthropic.AsyncAnthropic", return_value=mock_client):
                resp = await _agent().generate_with_tools(
                    query="read x.ts",
                    tools=[
                        ToolDefinition(
                            qualified_name="filesystem.read_file",
                            description="read",
                            input_schema={"type": "object"},
                        )
                    ],
                    executor=executor,
                )

            assert resp.text == "the file says hello"
            assert len(resp.tool_calls) == 1
            assert resp.tool_calls[0].name == "filesystem.read_file"
            assert resp.tool_calls[0].arguments == {"path": "x.ts"}
            executor.assert_awaited_once()
            assert mock_client.messages.create.await_count == 2

        asyncio.run(run())

    def test_caps_at_max_tool_calls_per_turn(self):
        async def run():
            mock_client = _make_mock_client()
            tool_use_resp = _response(
                [_tool_use_block("call", "filesystem.read_file", {"path": "x"})],
                stop_reason="tool_use",
            )
            mock_client.messages.create = AsyncMock(return_value=tool_use_resp)
            mock_client.close = AsyncMock()
            executor = AsyncMock(return_value=ToolResult(call_id="call", content="ok"))

            with patch("anthropic.AsyncAnthropic", return_value=mock_client):
                await _agent().generate_with_tools(
                    query="x",
                    tools=[
                        ToolDefinition(
                            qualified_name="filesystem.read_file",
                            description="r",
                            input_schema={"type": "object"},
                        )
                    ],
                    executor=executor,
                    max_tool_calls_per_turn=3,
                )

            assert mock_client.messages.create.await_count == 4
            assert executor.await_count == 4

        asyncio.run(run())

    def test_propagates_executor_error_via_is_error_flag(self):
        async def run():
            mock_client = _make_mock_client()
            first = _response(
                [_tool_use_block("call_x", "fs.read", {})],
                stop_reason="tool_use",
            )
            second = _response([_text_block("ok despite error")], stop_reason="end_turn")
            mock_client.messages.create = AsyncMock(side_effect=[first, second])
            mock_client.close = AsyncMock()

            executor = AsyncMock(
                return_value=ToolResult(call_id="call_x", content="permission denied", is_error=True)
            )

            with patch("anthropic.AsyncAnthropic", return_value=mock_client):
                resp = await _agent().generate_with_tools(
                    query="x",
                    tools=[ToolDefinition(qualified_name="fs.read", description="", input_schema={})],
                    executor=executor,
                )

            second_call_args = mock_client.messages.create.await_args_list[1].kwargs
            tool_result_msg = second_call_args["messages"][-1]
            assert tool_result_msg["role"] == "user"
            assert tool_result_msg["content"][0]["is_error"] is True
            assert tool_result_msg["content"][0]["content"] == "permission denied"
            assert resp.text == "ok despite error"

        asyncio.run(run())

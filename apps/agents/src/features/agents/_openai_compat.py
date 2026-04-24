"""Shared tool-use loop for OpenAI-compatible providers.

OpenAI, Groq, and xAI all expose the ChatCompletions "tool_calls"
contract via the ``openai`` Python SDK. This module centralizes the
tool-use loop so each provider adapter only supplies its client
factory and model id.
"""

from __future__ import annotations

import json
from typing import Any, Awaitable, Callable, Optional

from .base_agent import (
    ToolCall,
    ToolDefinition,
    ToolExecutor,
    ToolUseResponse,
)


ClientFactory = Callable[[], tuple[Any, Any]]


def _to_openai_tools(tools: list[ToolDefinition]) -> list[dict]:
    return [
        {
            "type": "function",
            "function": {
                "name": t.qualified_name,
                "description": t.description or "",
                "parameters": t.input_schema or {"type": "object", "properties": {}},
            },
        }
        for t in tools
    ]


async def run_openai_tool_loop(
    *,
    model_id: str,
    query: str,
    tools: list[ToolDefinition],
    executor: ToolExecutor,
    system_prompt: str,
    client_factory: ClientFactory,
    max_tool_calls_per_turn: int = 5,
    temperature: float = 0.7,
    max_tokens: int = 2000,
) -> ToolUseResponse:
    client, http_client = client_factory()
    try:
        openai_tools = _to_openai_tools(tools)
        messages: list[dict] = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]

        collected: list[ToolCall] = []
        total_tokens = 0
        text_accum = ""
        iterations = 0

        while iterations < max_tool_calls_per_turn + 1:
            iterations += 1
            response = await client.chat.completions.create(
                model=model_id,
                messages=messages,
                tools=openai_tools if openai_tools else None,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            if response.usage:
                total_tokens += response.usage.total_tokens

            choice = response.choices[0]
            message = choice.message
            tool_calls = getattr(message, "tool_calls", None) or []

            if message.content:
                text_accum += message.content

            if not tool_calls:
                break

            # Append the assistant message (with tool_calls) to history
            messages.append(
                {
                    "role": "assistant",
                    "content": message.content or "",
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.function.name,
                                "arguments": tc.function.arguments,
                            },
                        }
                        for tc in tool_calls
                    ],
                }
            )

            for tc in tool_calls:
                try:
                    args = json.loads(tc.function.arguments or "{}")
                except json.JSONDecodeError:
                    args = {}
                call = ToolCall(call_id=tc.id, name=tc.function.name, arguments=args)
                collected.append(call)
                result = await executor(call)
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.call_id,
                        "content": result.content if not result.is_error else f"ERROR: {result.content}",
                    }
                )

        return ToolUseResponse(text=text_accum.strip(), tool_calls=collected, tokens=total_tokens)
    finally:
        if http_client is not None:
            await http_client.aclose()

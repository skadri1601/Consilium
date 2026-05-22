"""Shared tool-use loop and base class for OpenAI-compatible providers.

OpenAI, Groq, xAI, Moonshot, and OpenRouter all expose the
ChatCompletions ``tool_calls`` contract via the ``openai`` Python SDK.
This module centralizes both the tool-use loop AND the surrounding
boilerplate (generate_response / stream_response / health_check) so
each provider adapter only supplies its base URL, env var, and any
provider-specific client kwargs (e.g. OpenRouter's attribution
headers).
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any, Callable, Optional, Tuple

from .base_agent import (
    BaseAgent,
    ToolCall,
    ToolDefinition,
    ToolExecutor,
    ToolUseResponse,
)
from .reasoning_effort import normalize_effort, to_openai_effort

logger = logging.getLogger(__name__)


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


class BaseOpenAICompatAgent(BaseAgent):
    """Common implementation for every OpenAI-compatible provider.

    Subclasses set ``base_url`` (None for OpenAI itself, since the SDK
    defaults to ``api.openai.com``) and optionally override
    ``_extra_client_kwargs`` for provider-specific headers (e.g.
    OpenRouter's HTTP-Referer / X-Title attribution).
    """

    base_url: Optional[str] = None
    supports_reasoning_effort: bool = False

    def _extra_client_kwargs(self) -> dict[str, Any]:
        return {}

    def _build_reasoning_kwargs(self, reasoning_effort: Optional[str]) -> dict[str, Any]:
        normalized = normalize_effort(reasoning_effort)
        if normalized is None:
            return {}
        if not self.supports_reasoning_effort:
            if reasoning_effort:
                logger.debug(
                    "Provider %s does not support reasoning_effort; ignoring %s",
                    self.provider, normalized,
                )
            return {}
        mapped = to_openai_effort(normalized)
        if mapped is None:
            return {}
        return {"reasoning_effort": mapped}

    def _create_openai_client(self) -> tuple[Any, Any]:
        import openai
        import httpx

        http_client = httpx.AsyncClient()
        kwargs: dict[str, Any] = {"api_key": self.api_key, "http_client": http_client}
        if self.base_url:
            kwargs["base_url"] = self.base_url
        kwargs.update(self._extra_client_kwargs())
        client = openai.AsyncOpenAI(**kwargs)
        return client, http_client

    async def generate_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> Tuple[str, int]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        http_client = None
        try:
            client, http_client = self._create_openai_client()
            extra = self._build_reasoning_kwargs(reasoning_effort)
            response = await client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt or self.get_system_prompt()},
                    {"role": "user", "content": query},
                ],
                temperature=0.7,
                max_tokens=2000,
                **extra,
            )
            content = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            return content, tokens
        except Exception as e:
            self._handle_common_errors(e, "API")
        finally:
            if http_client:
                await http_client.aclose()

    async def stream_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> AsyncIterator[str]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        http_client = None
        try:
            client, http_client = self._create_openai_client()
            extra = self._build_reasoning_kwargs(reasoning_effort)
            stream = await client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt or self.get_system_prompt()},
                    {"role": "user", "content": query},
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True,
                **extra,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            self._handle_common_errors(e, "Streaming")
        finally:
            if http_client:
                await http_client.aclose()

    async def generate_with_tools(
        self,
        query: str,
        tools: list[ToolDefinition],
        executor: ToolExecutor,
        system_prompt: Optional[str] = None,
        max_tool_calls_per_turn: int = 5,
    ) -> ToolUseResponse:
        if not self._validate_api_key():
            self._raise_no_api_key()
        try:
            return await run_openai_tool_loop(
                model_id=self.model_id,
                query=query,
                tools=tools,
                executor=executor,
                system_prompt=system_prompt or self.get_system_prompt(),
                client_factory=self._create_openai_client,
                max_tool_calls_per_turn=max_tool_calls_per_turn,
            )
        except Exception as e:
            self._handle_common_errors(e, "tool-use")

    async def health_check(self) -> bool:
        if not self._validate_api_key():
            return False

        http_client = None
        try:
            client, http_client = self._create_openai_client()
            await client.models.list()
            return True
        except Exception:
            # Any error from the upstream API or network is "unhealthy"
            # for the purposes of this readiness probe; the caller treats
            # bool unconditionally and detailed errors are surfaced
            # through generate_response paths instead.
            return False
        finally:
            if http_client:
                await http_client.aclose()

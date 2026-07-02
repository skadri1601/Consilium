from collections.abc import AsyncIterator
from typing import Optional, Tuple
from .base_agent import (
    BaseAgent,
    ToolCall,
    ToolDefinition,
    ToolExecutor,
    ToolUseResponse,
)
from .reasoning_effort import apply_anthropic_thinking


class AnthropicAgent(BaseAgent):
    """Anthropic Claude agent implementation."""

    def __init__(self, model_id: str = "claude-haiku-4-5-20251001", api_key: str | None = None):
        super().__init__(
            name="Claude",
            provider="Anthropic",
            model=model_id,
            api_key_env_var="ANTHROPIC_API_KEY"
        )
        self.model_id = model_id
        # Override API key if explicitly provided
        if api_key:
            self.api_key = api_key

    async def generate_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> Tuple[str, int]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            kwargs: dict = {
                "model": self.model_id,
                "max_tokens": 2000,
                "system": system_prompt or self.get_system_prompt(),
                "messages": [{"role": "user", "content": query}],
            }
            apply_anthropic_thinking(kwargs, self.model_id, reasoning_effort)
            response = await client.messages.create(**kwargs)

            text_chunks = [
                getattr(block, "text", "")
                for block in (response.content or [])
                if getattr(block, "type", None) == "text"
            ]
            content = "".join(text_chunks)
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return content, tokens

        except Exception as e:
            self._handle_common_errors(e, "API")

    async def stream_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> AsyncIterator[str]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            kwargs: dict = {
                "model": self.model_id,
                "max_tokens": 2000,
                "system": system_prompt or self.get_system_prompt(),
                "messages": [{"role": "user", "content": query}],
            }
            apply_anthropic_thinking(kwargs, self.model_id, reasoning_effort)
            async with client.messages.stream(**kwargs) as stream:
                async for text in stream.text_stream:
                    yield text

        except Exception as e:
            self._handle_common_errors(e, "Streaming")

    async def generate_with_tools(
        self,
        query: str,
        tools: list[ToolDefinition],
        executor: ToolExecutor,
        system_prompt: Optional[str] = None,
        max_tool_calls_per_turn: int = 5,
    ) -> ToolUseResponse:
        """Anthropic tool-use loop.

        Anthropic returns content blocks of type ``tool_use``; we mirror
        that in the conversation as ``tool_result`` blocks and iterate
        until the model produces only text or we hit the per-turn cap.
        """
        if not self._validate_api_key():
            self._raise_no_api_key()

        client = None
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            anthropic_tools = [
                {
                    "name": t.qualified_name,
                    "description": t.description,
                    "input_schema": t.input_schema or {"type": "object", "properties": {}},
                }
                for t in tools
            ]

            messages: list[dict] = [{"role": "user", "content": query}]
            total_tokens = 0
            collected_tool_calls: list[ToolCall] = []
            text_accum = ""
            iterations = 0

            while iterations < max_tool_calls_per_turn + 1:
                iterations += 1
                response = await client.messages.create(
                    model=self.model_id,
                    max_tokens=2000,
                    system=system_prompt or self.get_system_prompt(),
                    tools=anthropic_tools,
                    messages=messages,
                )
                total_tokens += response.usage.input_tokens + response.usage.output_tokens

                tool_use_blocks = []
                for block in response.content:
                    block_type = getattr(block, "type", None)
                    if block_type == "text":
                        text_accum += getattr(block, "text", "")
                    elif block_type == "tool_use":
                        tool_use_blocks.append(block)

                if not tool_use_blocks or response.stop_reason != "tool_use":
                    break

                messages.append({"role": "assistant", "content": [b.model_dump() for b in response.content]})

                tool_results_payload = []
                for block in tool_use_blocks:
                    call = ToolCall(
                        call_id=block.id,
                        name=block.name,
                        arguments=dict(block.input or {}),
                    )
                    collected_tool_calls.append(call)
                    result = await executor(call)
                    tool_results_payload.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": call.call_id,
                            "content": result.content,
                            "is_error": result.is_error,
                        }
                    )
                messages.append({"role": "user", "content": tool_results_payload})

            return ToolUseResponse(
                text=text_accum.strip(),
                tool_calls=collected_tool_calls,
                tokens=total_tokens,
            )

        except Exception as e:
            self._handle_common_errors(e, "tool-use")
        finally:
            if client is not None:
                await client.close()

    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible."""
        if not self._validate_api_key():
            return False

        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception:
            return False

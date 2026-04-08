from typing import AsyncGenerator, Optional, Tuple
from .base_agent import BaseAgent


class AnthropicAgent(BaseAgent):
    """Anthropic Claude agent implementation."""

    def __init__(self, model_id: str = "claude-3-5-haiku-latest", api_key: str | None = None):
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

    async def generate_response(self, query: str, system_prompt: Optional[str] = None) -> Tuple[str, int]:
        if not self._validate_api_key():
            return f"[{self.name} Error: No API key provided]", 0

        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            response = await client.messages.create(
                model=self.model_id,
                max_tokens=2000,
                system=system_prompt or self.get_system_prompt(),
                messages=[{"role": "user", "content": query}]
            )

            content = response.content[0].text if response.content else ""
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return content, tokens

        except Exception as e:
            return self._handle_common_errors(e, "API"), 0

    async def stream_response(self, query: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        if not self._validate_api_key():
            yield f"[{self.name} Error: No API key provided]"
            return

        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            async with client.messages.stream(
                model=self.model_id,
                max_tokens=2000,
                system=system_prompt or self.get_system_prompt(),
                messages=[{"role": "user", "content": query}]
            ) as stream:
                async for text in stream.text_stream:
                    yield text

        except Exception as e:
            yield self._handle_common_errors(e, "Streaming")

    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible."""
        if not self._validate_api_key():
            return False

        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception:
            return False

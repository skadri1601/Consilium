import os
from typing import AsyncGenerator, Tuple
from .base_agent import BaseAgent


class AnthropicAgent(BaseAgent):
    """Anthropic Claude agent implementation."""

    def __init__(self):
        super().__init__(
            name="Claude 3",
            provider="Anthropic",
            model="claude-3-opus"
        )
        self.api_key = os.getenv("ANTHROPIC_API_KEY")

    async def generate_response(self, query: str) -> Tuple[str, int]:
        """Generate a response using Anthropic's API."""
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)

            response = await client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                system=self.get_system_prompt(),
                messages=[
                    {"role": "user", "content": query}
                ]
            )

            content = response.content[0].text if response.content else ""
            tokens = response.usage.input_tokens + response.usage.output_tokens

            return content, tokens

        except Exception as e:
            return f"[Claude Error: {str(e)}]", 0

    async def stream_response(self, query: str) -> AsyncGenerator[str, None]:
        """Stream a response using Anthropic's API."""
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)

            async with client.messages.stream(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                system=self.get_system_prompt(),
                messages=[
                    {"role": "user", "content": query}
                ]
            ) as stream:
                async for text in stream.text_stream:
                    yield text

        except Exception as e:
            yield f"[Claude Stream Error: {str(e)}]"

    async def health_check(self) -> bool:
        """Check if Anthropic API is accessible."""
        if not self.api_key:
            return False

        try:
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=self.api_key)
            # Simple validation - attempt to create a minimal message
            await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}]
            )
            return True
        except Exception:
            return False

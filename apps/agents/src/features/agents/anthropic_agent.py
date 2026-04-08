import os
from typing import AsyncGenerator, Optional, Tuple
from .base_agent import BaseAgent


class AnthropicAgent(BaseAgent):
    """Anthropic Claude agent implementation."""

    def __init__(self, model_id: str = "claude-3-5-haiku-latest", api_key: str | None = None):
        super().__init__(
            name="Claude",
            provider="Anthropic",
            model=model_id
        )
        self.model_id = model_id
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")

    async def generate_response(self, query: str, system_prompt: Optional[str] = None) -> Tuple[str, int]:
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)

            response = await client.messages.create(
                model=self.model_id,
                max_tokens=2000,
                system=system_prompt or self.get_system_prompt(),
                messages=[
                    {"role": "user", "content": query}
                ]
            )

            content = response.content[0].text if response.content else ""
            tokens = response.usage.input_tokens + response.usage.output_tokens

            return content, tokens

        except (anthropic.APIConnectionError, anthropic.RateLimitError,
                anthropic.APIStatusError) as e:
            return f"[Claude API Error: {str(e)}]", 0
        except anthropic.AuthenticationError as e:
            return f"[Claude Auth Error: {str(e)}]", 0
        except Exception as e:
            return f"[Claude Error: {str(e)}]", 0

    async def stream_response(self, query: str, system_prompt: Optional[str] = None) -> AsyncGenerator[str, None]:
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self.api_key)

            async with client.messages.stream(
                model=self.model_id,
                max_tokens=2000,
                system=system_prompt or self.get_system_prompt(),
                messages=[
                    {"role": "user", "content": query}
                ]
            ) as stream:
                async for text in stream.text_stream:
                    yield text

        except (anthropic.APIConnectionError, anthropic.RateLimitError,
                anthropic.APIStatusError) as e:
            yield f"[Claude API Error: {str(e)}]"
        except anthropic.AuthenticationError as e:
            yield f"[Claude Auth Error: {str(e)}]"

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
        except (anthropic.APIConnectionError, anthropic.RateLimitError,
                anthropic.APIStatusError, anthropic.AuthenticationError):
            return False

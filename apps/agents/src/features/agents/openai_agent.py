import os
from typing import AsyncGenerator, Tuple
from .base_agent import BaseAgent


class OpenAIAgent(BaseAgent):
    """OpenAI GPT-4 agent implementation."""

    def __init__(self):
        super().__init__(
            name="GPT-4",
            provider="OpenAI",
            model="gpt-4-turbo"
        )
        self.api_key = os.getenv("OPENAI_API_KEY")

    async def generate_response(self, query: str) -> Tuple[str, int]:
        """Generate a response using OpenAI's API."""
        try:
            import openai

            client = openai.AsyncOpenAI(api_key=self.api_key)

            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": query}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            content = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0

            return content, tokens

        except Exception as e:
            return f"[GPT-4 Error: {str(e)}]", 0

    async def stream_response(self, query: str) -> AsyncGenerator[str, None]:
        """Stream a response using OpenAI's API."""
        try:
            import openai

            client = openai.AsyncOpenAI(api_key=self.api_key)

            stream = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": query}
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            yield f"[GPT-4 Stream Error: {str(e)}]"

    async def health_check(self) -> bool:
        """Check if OpenAI API is accessible."""
        if not self.api_key:
            return False

        try:
            import openai
            client = openai.AsyncOpenAI(api_key=self.api_key)
            await client.models.list()
            return True
        except Exception:
            return False

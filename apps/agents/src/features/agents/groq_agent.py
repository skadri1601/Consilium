import os
from typing import AsyncGenerator, Tuple
from .base_agent import BaseAgent


class GroqAgent(BaseAgent):
    """Groq LLM agent implementation (OpenAI-compatible API)."""

    def __init__(self, model_id: str = "llama-3.1-8b-instant", api_key: str | None = None):
        super().__init__(
            name="Groq",
            provider="Groq",
            model=model_id
        )
        self.model_id = model_id
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1"

    async def generate_response(self, query: str) -> Tuple[str, int]:
        """Generate a response using Groq's OpenAI-compatible API."""
        try:
            import openai
            import httpx

            # Create custom HTTP client to avoid proxy detection issues in older SDK versions
            async with httpx.AsyncClient() as http_client:
                client = openai.AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, http_client=http_client)

                response = await client.chat.completions.create(
                    model=self.model_id,
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

        except (openai.APIConnectionError, openai.RateLimitError, openai.APIStatusError) as e:
            return f"[Groq API Error: {str(e)}]", 0
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            return f"[Groq Network Error: {str(e)}]", 0

    async def stream_response(self, query: str) -> AsyncGenerator[str, None]:
        """Stream a response using Groq's OpenAI-compatible API."""
        http_client = None
        try:
            import openai
            import httpx

            # Create custom HTTP client to avoid proxy detection issues in older SDK versions
            http_client = httpx.AsyncClient()
            client = openai.AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, http_client=http_client)

            stream = await client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": self.get_system_prompt()},
                    {"role": "user", "content": query}
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except (openai.APIConnectionError, openai.RateLimitError, openai.APIStatusError) as e:
            yield f"[Groq API Error: {str(e)}]"
        except (httpx.RequestError, httpx.HTTPStatusError) as e:
            yield f"[Groq Network Error: {str(e)}]"
        finally:
            if http_client:
                await http_client.aclose()

    async def health_check(self) -> bool:
        """Check if Groq API is accessible."""
        if not self.api_key:
            return False

        try:
            import openai
            import httpx

            # Create custom HTTP client to avoid proxy detection issues in older SDK versions
            async with httpx.AsyncClient() as http_client:
                client = openai.AsyncOpenAI(api_key=self.api_key, base_url=self.base_url, http_client=http_client)
                await client.models.list()
                return True
        except (openai.APIConnectionError, openai.RateLimitError, openai.APIStatusError,
                httpx.RequestError, httpx.HTTPStatusError):
            return False

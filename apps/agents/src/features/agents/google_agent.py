import os
from typing import AsyncGenerator, Tuple
from .base_agent import BaseAgent

try:
    import google.generativeai as genai
    from google.api_core import exceptions as google_exceptions
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False
    genai = None  # type: ignore
    google_exceptions = None  # type: ignore


class GoogleAgent(BaseAgent):
    """Google Gemini agent implementation."""

    def __init__(self, model_id: str = "gemini-3-flash-preview", api_key: str | None = None):
        super().__init__(
            name="Gemini",
            provider="Google",
            model=model_id
        )
        self.model_id = model_id
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")

    async def generate_response(self, query: str) -> Tuple[str, int]:
        """Generate a response using Google's Gemini API."""
        try:
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_id)

            # Combine system prompt with query
            full_prompt = f"{self.get_system_prompt()}\n\nUser Query: {query}"

            response = await model.generate_content_async(full_prompt)

            content = response.text if response.text else ""
            # Gemini doesn't provide token counts directly in the same way
            tokens = len(content.split()) * 2  # Rough estimate

            return content, tokens

        except (google_exceptions.GoogleAPIError, google_exceptions.RetryError) as e:
            return f"[Gemini API Error: {str(e)}]", 0
        except (google_exceptions.InvalidArgument, google_exceptions.PermissionDenied) as e:
            return f"[Gemini Auth Error: {str(e)}]", 0

    async def stream_response(self, query: str) -> AsyncGenerator[str, None]:
        """Stream a response using Google's Gemini API."""
        try:
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_id)

            full_prompt = f"{self.get_system_prompt()}\n\nUser Query: {query}"

            response = await model.generate_content_async(
                full_prompt,
                stream=True
            )

            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except (google_exceptions.GoogleAPIError, google_exceptions.RetryError) as e:
            yield f"[Gemini API Error: {str(e)}]"
        except (google_exceptions.InvalidArgument, google_exceptions.PermissionDenied) as e:
            yield f"[Gemini Auth Error: {str(e)}]"

    async def health_check(self) -> bool:
        """Check if Google Gemini API is accessible."""
        if not self.api_key:
            return False

        try:
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(self.model_id)
            await model.generate_content_async("ping")
            return True
        except (google_exceptions.GoogleAPIError, google_exceptions.RetryError,
                google_exceptions.InvalidArgument, google_exceptions.PermissionDenied):
            return False

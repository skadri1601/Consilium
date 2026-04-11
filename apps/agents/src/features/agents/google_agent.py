from collections.abc import AsyncIterator
from typing import Optional, Tuple
from .base_agent import BaseAgent, LLMProviderError

try:
    import google.generativeai as genai
    HAS_GOOGLE = True
except ImportError:
    HAS_GOOGLE = False
    genai = None  # type: ignore

_GOOGLE_PKG_MISSING = "Google Generative AI package not installed"


class GoogleAgent(BaseAgent):
    """Google Gemini agent implementation."""

    def __init__(self, model_id: str = "gemini-3-flash-preview", api_key: str | None = None):
        super().__init__(
            name="Gemini",
            provider="Google",
            model=model_id,
            api_key_env_var="GOOGLE_API_KEY"
        )
        self.model_id = model_id
        # Override API key if explicitly provided
        if api_key:
            self.api_key = api_key

    def _create_model(self):
        """Create and configure Google Generative AI model."""
        if not HAS_GOOGLE:
            raise ImportError(_GOOGLE_PKG_MISSING)
        assert genai is not None
        genai.configure(api_key=self.api_key)
        return genai.GenerativeModel(self.model_id)

    async def generate_response(self, query: str, system_prompt: Optional[str] = None) -> Tuple[str, int]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        if not HAS_GOOGLE:
            raise LLMProviderError(
                provider=self.provider,
                error_type="unknown",
                original_error=_GOOGLE_PKG_MISSING,
            )

        try:
            model = self._create_model()
            full_prompt = f"{system_prompt or self.get_system_prompt()}\n\nUser Query: {query}"
            response = await model.generate_content_async(full_prompt)

            content = response.text if response.text else ""
            tokens = len(content.split()) * 2
            return content, tokens

        except Exception as e:
            self._handle_common_errors(e, "API")

    async def stream_response(self, query: str, system_prompt: Optional[str] = None) -> AsyncIterator[str]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        if not HAS_GOOGLE:
            raise LLMProviderError(
                provider=self.provider,
                error_type="unknown",
                original_error=_GOOGLE_PKG_MISSING,
            )

        try:
            model = self._create_model()
            full_prompt = f"{system_prompt or self.get_system_prompt()}\n\nUser Query: {query}"
            response = await model.generate_content_async(full_prompt, stream=True)

            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            self._handle_common_errors(e, "Streaming")

    async def health_check(self) -> bool:
        """Check if Google Gemini API is accessible."""
        if not self._validate_api_key() or not HAS_GOOGLE:
            return False

        try:
            model = self._create_model()
            await model.generate_content_async("ping")
            return True
        except Exception:
            return False

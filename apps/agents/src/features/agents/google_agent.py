from collections.abc import AsyncIterator
from typing import Any, Optional, Tuple
from .base_agent import (
    BaseAgent,
    LLMProviderError,
    ToolCall,
    ToolDefinition,
    ToolExecutor,
    ToolUseResponse,
)

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

    async def generate_with_tools(
        self,
        query: str,
        tools: list[ToolDefinition],
        executor: ToolExecutor,
        system_prompt: Optional[str] = None,
        max_tool_calls_per_turn: int = 5,
    ) -> ToolUseResponse:
        """Gemini function-calling loop.

        Gemini uses a ``tools=[{function_declarations: [...]}]`` request
        shape and returns ``function_call`` parts in the response. We
        mirror each call's result as a ``function_response`` part and
        iterate until the model produces only text.
        """
        if not self._validate_api_key():
            self._raise_no_api_key()
        if not HAS_GOOGLE:
            raise LLMProviderError(
                provider=self.provider,
                error_type="unknown",
                original_error=_GOOGLE_PKG_MISSING,
            )

        if genai is None:
            raise LLMProviderError(
                provider=self.provider,
                error_type="unknown",
                original_error=_GOOGLE_PKG_MISSING,
            )

        try:
            genai.configure(api_key=self.api_key)

            declarations = [
                {
                    "name": t.qualified_name,
                    "description": t.description or "",
                    "parameters": t.input_schema or {"type": "object", "properties": {}},
                }
                for t in tools
            ]
            gemini_tools = [{"function_declarations": declarations}] if declarations else None

            model = genai.GenerativeModel(
                self.model_id,
                tools=gemini_tools,
                system_instruction=system_prompt or self.get_system_prompt(),
            )
            chat = model.start_chat()

            collected: list[ToolCall] = []
            text_accum = ""
            total_tokens = 0
            iterations = 0

            next_message: Any = query  # first turn: user prompt; later turns: function response parts

            while iterations < max_tool_calls_per_turn + 1:
                iterations += 1
                response = await chat.send_message_async(next_message)

                fn_calls = []
                for candidate in getattr(response, "candidates", []) or []:
                    parts = getattr(candidate.content, "parts", []) or []
                    for part in parts:
                        if getattr(part, "text", None):
                            text_accum += part.text
                        fc = getattr(part, "function_call", None)
                        if fc and getattr(fc, "name", None):
                            fn_calls.append(fc)

                usage = getattr(response, "usage_metadata", None)
                if usage is not None:
                    total_tokens += getattr(usage, "total_token_count", 0)

                if not fn_calls:
                    break

                response_parts = []
                for fc in fn_calls:
                    args = dict(fc.args or {})
                    call = ToolCall(call_id=f"{fc.name}-{iterations}", name=fc.name, arguments=args)
                    collected.append(call)
                    result = await executor(call)
                    response_parts.append(
                        {
                            "function_response": {
                                "name": fc.name,
                                "response": {
                                    "content": result.content,
                                    "is_error": result.is_error,
                                },
                            }
                        }
                    )
                next_message = response_parts

            return ToolUseResponse(
                text=text_accum.strip(),
                tool_calls=collected,
                tokens=total_tokens,
            )
        except Exception as e:
            self._handle_common_errors(e, "tool-use")

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

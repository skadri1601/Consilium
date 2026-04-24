from collections.abc import AsyncIterator
from typing import Optional, Tuple
from ._openai_compat import run_openai_tool_loop
from .base_agent import BaseAgent, ToolDefinition, ToolExecutor, ToolUseResponse


class OpenRouterAgent(BaseAgent):
    """OpenRouter agent — unified OpenAI-compatible gateway to 300+ models.

    Endpoint: https://openrouter.ai/api/v1
    Free tier includes 29 models from Google, Meta, Mistral, NVIDIA and
    more (community-funded credit pool). Model IDs are namespaced as
    '<provider>/<model>' (e.g. 'meta-llama/llama-3.3-70b-instruct:free').
    """

    def __init__(
        self,
        model_id: str = "meta-llama/llama-3.3-70b-instruct:free",
        api_key: str | None = None,
    ):
        super().__init__(
            name="OpenRouter",
            provider="OpenRouter",
            model=model_id,
            api_key_env_var="OPENROUTER_API_KEY",
        )
        self.model_id = model_id
        self.base_url = "https://openrouter.ai/api/v1"
        if api_key:
            self.api_key = api_key

    def _create_openai_client(self):
        import openai
        import httpx

        http_client = httpx.AsyncClient()
        # OpenRouter recommends setting HTTP-Referer + X-Title headers for
        # app attribution on their free-tier ranking. Optional but polite.
        client = openai.AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            http_client=http_client,
            default_headers={
                "HTTP-Referer": "https://myconsilium.xyz",
                "X-Title": "Consilium",
            },
        )
        return client, http_client

    async def generate_response(self, query: str, system_prompt: Optional[str] = None) -> Tuple[str, int]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        http_client = None
        try:
            client, http_client = self._create_openai_client()
            response = await client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt or self.get_system_prompt()},
                    {"role": "user", "content": query},
                ],
                temperature=0.7,
                max_tokens=2000,
            )
            content = response.choices[0].message.content or ""
            tokens = response.usage.total_tokens if response.usage else 0
            return content, tokens
        except Exception as e:
            self._handle_common_errors(e, "API")
        finally:
            if http_client:
                await http_client.aclose()

    async def stream_response(self, query: str, system_prompt: Optional[str] = None) -> AsyncIterator[str]:
        if not self._validate_api_key():
            self._raise_no_api_key()

        http_client = None
        try:
            client, http_client = self._create_openai_client()
            stream = await client.chat.completions.create(
                model=self.model_id,
                messages=[
                    {"role": "system", "content": system_prompt or self.get_system_prompt()},
                    {"role": "user", "content": query},
                ],
                temperature=0.7,
                max_tokens=2000,
                stream=True,
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
            return False
        finally:
            if http_client:
                await http_client.aclose()

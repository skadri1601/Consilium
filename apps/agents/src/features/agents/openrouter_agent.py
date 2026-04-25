from typing import Any

from ._openai_compat import BaseOpenAICompatAgent


class OpenRouterAgent(BaseOpenAICompatAgent):
    """OpenRouter agent — unified OpenAI-compatible gateway to 300+ models.

    Endpoint: https://openrouter.ai/api/v1
    Free tier roster (verified Apr 25, 2026): qwen/qwen3-coder:free,
    google/gemma-4-26b-a4b-it:free, google/gemma-4-31b-it:free,
    nvidia/nemotron-3-super-120b-a12b:free, inclusionai/ling-2.6-1t:free.
    Model IDs are namespaced as '<provider>/<model>'.
    """

    base_url = "https://openrouter.ai/api/v1"

    def __init__(
        self,
        model_id: str = "qwen/qwen3-coder:free",
        api_key: str | None = None,
    ):
        super().__init__(
            name="OpenRouter",
            provider="OpenRouter",
            model=model_id,
            api_key_env_var="OPENROUTER_API_KEY",
        )
        self.model_id = model_id
        if api_key:
            self.api_key = api_key

    def _extra_client_kwargs(self) -> dict[str, Any]:
        # OpenRouter recommends app attribution headers for free-tier
        # ranking. Optional but polite.
        return {
            "default_headers": {
                "HTTP-Referer": "https://myconsilium.xyz",
                "X-Title": "Consilium",
            }
        }

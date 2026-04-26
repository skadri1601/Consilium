from ._openai_compat import BaseOpenAICompatAgent


class XAIAgent(BaseOpenAICompatAgent):
    """X.AI (Grok) agent (OpenAI-compatible API)."""

    base_url = "https://api.x.ai/v1"

    def __init__(self, model_id: str = "grok-4-20", api_key: str | None = None):
        super().__init__(
            name="Grok",
            provider="X.AI",
            model=model_id,
            api_key_env_var="XAI_API_KEY",
        )
        self.model_id = model_id
        if api_key:
            self.api_key = api_key

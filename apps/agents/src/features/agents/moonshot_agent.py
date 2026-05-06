from ._openai_compat import BaseOpenAICompatAgent


class MoonshotAgent(BaseOpenAICompatAgent):
    """Moonshot AI (Kimi K2.x) agent - OpenAI-compatible API.

    Endpoint: https://api.moonshot.ai/v1
    Models: kimi-k2.6 (current flagship, 256K ctx, tool-use), kimi-k2.5,
    kimi-k2-thinking, kimi-k2-thinking-turbo, kimi-k2-turbo-preview.
    """

    base_url = "https://api.moonshot.ai/v1"

    def __init__(self, model_id: str = "kimi-k2.6", api_key: str | None = None):
        super().__init__(
            name="Kimi",
            provider="Moonshot",
            model=model_id,
            api_key_env_var="MOONSHOT_API_KEY",
        )
        self.model_id = model_id
        if api_key:
            self.api_key = api_key

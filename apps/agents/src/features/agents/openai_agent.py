from ._openai_compat import BaseOpenAICompatAgent


class OpenAIAgent(BaseOpenAICompatAgent):
    """OpenAI GPT agent. Default endpoint (api.openai.com) - no base_url override."""

    base_url = None
    supports_reasoning_effort = True

    def __init__(self, model_id: str = "gpt-5.4-mini", api_key: str | None = None):
        super().__init__(
            name="OpenAI",
            provider="OpenAI",
            model=model_id,
            api_key_env_var="OPENAI_API_KEY",
        )
        self.model_id = model_id
        if api_key:
            self.api_key = api_key

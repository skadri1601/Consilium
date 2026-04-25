from ._openai_compat import BaseOpenAICompatAgent


class GroqAgent(BaseOpenAICompatAgent):
    """Groq agent (OpenAI-compatible API)."""

    base_url = "https://api.groq.com/openai/v1"

    def __init__(self, model_id: str = "llama-3.1-8b-instant", api_key: str | None = None):
        super().__init__(
            name="Groq",
            provider="Groq",
            model=model_id,
            api_key_env_var="GROQ_API_KEY",
        )
        self.model_id = model_id
        if api_key:
            self.api_key = api_key

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, Tuple


class BaseAgent(ABC):

    def __init__(self, name: str, provider: str, model: str):
        self.name = name
        self.provider = provider
        self.model = model

    @abstractmethod
    async def generate_response(
        self, query: str, system_prompt: Optional[str] = None
    ) -> Tuple[str, int]:
        pass

    @abstractmethod
    async def stream_response(
        self, query: str, system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        pass

    def get_system_prompt(self) -> str:
        return f"""You are {self.name}, an AI assistant powered by {self.provider}'s {self.model}.
You are participating in a multi-agent council to provide thoughtful, accurate responses.
Be concise but thorough. If you're uncertain, express your confidence level."""

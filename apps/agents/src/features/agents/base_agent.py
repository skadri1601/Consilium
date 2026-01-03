from abc import ABC, abstractmethod
from typing import AsyncGenerator, Tuple


class BaseAgent(ABC):
    """Abstract base class for all AI agents."""

    def __init__(self, name: str, provider: str, model: str):
        self.name = name
        self.provider = provider
        self.model = model

    @abstractmethod
    async def generate_response(self, query: str) -> Tuple[str, int]:
        """
        Generate a response for the given query.

        Args:
            query: The user's query or prompt

        Returns:
            Tuple of (response_text, tokens_used)
        """
        pass

    @abstractmethod
    async def stream_response(self, query: str) -> AsyncGenerator[str, None]:
        """
        Stream a response for the given query.

        Args:
            query: The user's query or prompt

        Yields:
            Chunks of the response text
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the agent is healthy and can respond.

        Returns:
            True if healthy, False otherwise
        """
        pass

    def get_system_prompt(self) -> str:
        """Return the system prompt for this agent."""
        return f"""You are {self.name}, an AI assistant powered by {self.provider}'s {self.model}.
You are participating in a multi-agent council to provide thoughtful, accurate responses.
Be concise but thorough. If you're uncertain, express your confidence level."""

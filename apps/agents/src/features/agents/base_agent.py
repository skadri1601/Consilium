import os
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, Tuple, Dict, Any


class BaseAgent(ABC):
    """Base class for all AI agents with common functionality."""

    def __init__(self, name: str, provider: str, model: str, api_key_env_var: str):
        self.name = name
        self.provider = provider
        self.model = model
        self.api_key = os.getenv(api_key_env_var)

    @abstractmethod
    async def generate_response(
        self, query: str, system_prompt: Optional[str] = None
    ) -> Tuple[str, int]:
        """Generate a response to the given query."""
        pass

    @abstractmethod
    async def stream_response(
        self, query: str, system_prompt: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream a response to the given query."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the agent's API is accessible."""
        pass

    def get_system_prompt(self) -> str:
        """Get the default system prompt for this agent."""
        return f"""You are {self.name}, an AI assistant powered by {self.provider}'s {self.model}.
You are participating in a multi-agent council to provide thoughtful, accurate responses.
Be concise but thorough. If you're uncertain, express your confidence level."""

    def _handle_common_errors(self, e: Exception, operation: str = "operation") -> str:
        """Handle common API errors with consistent error messages."""
        error_name = type(e).__name__
        return f"[{self.name} {operation} Error: {error_name}: {str(e)}]"

    def _validate_api_key(self) -> bool:
        """Validate that API key is available."""
        return bool(self.api_key)

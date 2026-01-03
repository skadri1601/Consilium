from enum import Enum
from typing import Optional
from pydantic import BaseModel


class AgentType(str, Enum):
    """Supported agent types."""
    GPT4 = "gpt-4"
    CLAUDE = "claude"
    GEMINI = "gemini"


class ResponseStatus(str, Enum):
    """Response status codes."""
    SUCCESS = "success"
    ERROR = "error"
    PARTIAL = "partial"
    TIMEOUT = "timeout"


class SessionState(str, Enum):
    """Session states."""
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TokenUsage(BaseModel):
    """Token usage tracking."""
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0

    def add(self, input_tokens: int = 0, output_tokens: int = 0):
        """Add tokens to the usage count."""
        self.input_tokens += input_tokens
        self.output_tokens += output_tokens
        self.total_tokens = self.input_tokens + self.output_tokens


class APIError(BaseModel):
    """Standardized API error response."""
    code: str
    message: str
    details: Optional[dict] = None

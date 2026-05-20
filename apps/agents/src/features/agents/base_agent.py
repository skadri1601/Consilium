import os
import re
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any, Dict, NoReturn, Optional, Tuple


@dataclass
class ToolDefinition:
    qualified_name: str
    description: str
    input_schema: Dict[str, Any]


@dataclass
class ToolCall:
    call_id: str
    name: str
    arguments: Dict[str, Any]


@dataclass
class ToolResult:
    call_id: str
    content: str
    is_error: bool = False


@dataclass
class ToolUseResponse:
    text: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    tokens: int = 0


# Callback signature: takes a ToolCall, returns the awaited ToolResult.
ToolExecutor = Callable[[ToolCall], Awaitable[ToolResult]]


_ERROR_PATTERNS = [
    re.compile(r"\[.*Error:"),
    re.compile(r"RateLimitError", re.IGNORECASE),
    re.compile(r"insufficient_quota", re.IGNORECASE),
    re.compile(r"invalid_api_key", re.IGNORECASE),
    re.compile(r"\b401\b"),
    re.compile(r"\b429\b"),
    re.compile(r"\b403\b"),
    re.compile(r"AuthenticationError", re.IGNORECASE),
    re.compile(r"PermissionDeniedError", re.IGNORECASE),
]


def is_error_response(text: str) -> bool:
    if not text:
        return False
    return any(p.search(text) for p in _ERROR_PATTERNS)


class LLMProviderError(Exception):
    def __init__(
        self,
        provider: str,
        error_type: str,
        original_error: object = None,
        operation: str | None = None,
    ):
        self.provider = provider
        self.error_type = error_type
        self.original_error = original_error
        self.operation = operation
        op = f"{operation}: " if operation else ""
        super().__init__(f"[{provider}] {op}{error_type}: {original_error}")


def _classify_error(e: Exception) -> str:
    name = type(e).__name__.lower()
    msg = str(e).lower()
    if "ratelimit" in name or "429" in msg or "rate_limit" in msg or "rate limit" in msg:
        return "rate_limit"
    if "auth" in name or "401" in msg or "invalid_api_key" in msg or "invalid api key" in msg:
        return "auth"
    if "timeout" in name or "timed out" in msg:
        return "timeout"
    if "permission" in name or "403" in msg:
        return "auth"
    if "server" in name or "500" in msg or "502" in msg or "503" in msg:
        return "server_error"
    if "notfound" in name or "404" in msg:
        return "server_error"
    return "unknown"


class BaseAgent(ABC):

    def __init__(self, name: str, provider: str, model: str, api_key_env_var: str):
        self.name = name
        self.provider = provider
        self.model = model
        self.api_key = os.getenv(api_key_env_var)

    @abstractmethod
    async def generate_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> Tuple[str, int]:
        pass

    @abstractmethod
    def stream_response(
        self,
        query: str,
        system_prompt: Optional[str] = None,
        reasoning_effort: Optional[str] = None,
    ) -> AsyncIterator[str]:
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        pass

    async def generate_with_tools(
        self,
        query: str,
        tools: list[ToolDefinition],
        executor: ToolExecutor,
        system_prompt: Optional[str] = None,
        max_tool_calls_per_turn: int = 5,
    ) -> ToolUseResponse:
        """Generate a response with tool-use support.

        Default implementation raises NotImplementedError. Subclasses opt
        in to tool-use by overriding this. The orchestrator invokes
        ``executor`` for every tool call the model emits and feeds the
        result back into the conversation. ``max_tool_calls_per_turn``
        caps how many calls a single response can chain.
        """
        raise NotImplementedError(
            f"{self.provider} agent does not yet support tool-use. "
            "See docs/design/mcp-tool-protocol.md for adapter status."
        )

    def get_system_prompt(self) -> str:
        return f"""You are {self.name}, an AI assistant powered by {self.provider}'s {self.model}.
You are participating in a multi-agent council to provide thoughtful, accurate responses.
Be concise but thorough. If you're uncertain, express your confidence level."""

    def _handle_common_errors(self, e: Exception, operation: str = "operation") -> NoReturn:
        error_type = _classify_error(e)
        raise LLMProviderError(
            provider=self.provider,
            error_type=error_type,
            original_error=e,
            operation=operation,
        )

    def _validate_api_key(self) -> bool:
        return bool(self.api_key)

    def _raise_no_api_key(self) -> NoReturn:
        raise LLMProviderError(
            provider=self.provider,
            error_type="auth",
            original_error="No API key provided",
        )

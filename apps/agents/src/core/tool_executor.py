from collections.abc import Awaitable, Callable
from typing import Any

from src.core.debate_tools import DebateToolRegistry
from src.features.agents.base_agent import ToolCall, ToolResult


class DebateToolExecutor:
    def __init__(
        self,
        registry: DebateToolRegistry,
        tool_handlers: dict[str, Callable[[ToolCall], Awaitable[ToolResult]]] | None = None,
    ) -> None:
        self._registry = registry
        self._handlers: dict[str, Callable[[ToolCall], Awaitable[ToolResult]]] = dict(
            tool_handlers or {}
        )

    def register_handler(
        self, tool_name: str, handler: Callable[[ToolCall], Awaitable[ToolResult]]
    ) -> None:
        self._handlers[tool_name] = handler

    async def __call__(self, call: ToolCall) -> ToolResult:
        if self._registry.get(call.name) is None:
            return ToolResult(
                call_id=call.call_id,
                content=f"Unknown tool: {call.name}",
                is_error=True,
            )

        handler = self._handlers.get(call.name)
        if handler is None:
            return ToolResult(
                call_id=call.call_id,
                content=f"No handler registered for tool: {call.name}",
                is_error=True,
            )

        try:
            return await handler(call)
        except Exception as exc:
            return ToolResult(
                call_id=call.call_id,
                content=f"Tool execution error: {exc}",
                is_error=True,
            )

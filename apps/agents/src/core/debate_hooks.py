from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Awaitable, Callable

logger = logging.getLogger(__name__)


class HookEvent(Enum):
    PRE_DEBATE = "pre_debate"
    POST_DEBATE = "post_debate"
    PRE_ROUND = "pre_round"
    POST_ROUND = "post_round"
    PRE_AGENT_CALL = "pre_agent_call"
    POST_AGENT_CALL = "post_agent_call"
    POST_AGENT_FAILURE = "post_agent_failure"
    PRE_JUDGE = "pre_judge"
    POST_JUDGE = "post_judge"
    ON_CANCELLATION = "on_cancellation"
    ON_CONVERGENCE = "on_convergence"
    ON_ANTI_CAPITULATION = "on_anti_capitulation"


@dataclass
class HookContext:
    debate_id: str
    event: HookEvent
    round_number: int | None = None
    agent_id: str | None = None
    data: dict[str, Any] = field(default_factory=dict)


@dataclass
class HookResult:
    proceed: bool = True
    modified_data: dict[str, Any] | None = None
    messages: list[str] = field(default_factory=list)
    abort_reason: str | None = None

    @classmethod
    def allow(cls, messages: list[str] | None = None) -> HookResult:
        return cls(proceed=True, messages=messages or [])

    @classmethod
    def deny(cls, reason: str) -> HookResult:
        return cls(proceed=False, abort_reason=reason)

    @classmethod
    def modify(cls, data: dict[str, Any]) -> HookResult:
        return cls(proceed=True, modified_data=data)


HookHandler = Callable[[HookContext], Awaitable[HookResult]]


class HookRegistry:

    def __init__(self):
        self._hooks: dict[HookEvent, list[HookHandler]] = {}

    def register(self, event: HookEvent, handler: HookHandler) -> None:
        self._hooks.setdefault(event, []).append(handler)

    def unregister(self, event: HookEvent, handler: HookHandler) -> None:
        handlers = self._hooks.get(event, [])
        if handler in handlers:
            handlers.remove(handler)

    def clear(self, event: HookEvent | None = None) -> None:
        if event:
            self._hooks.pop(event, None)
        else:
            self._hooks.clear()

    async def run(self, context: HookContext) -> HookResult:
        handlers = self._hooks.get(context.event, [])
        if not handlers:
            return HookResult.allow()

        combined_messages: list[str] = []
        for handler in handlers:
            try:
                result = await handler(context)
                combined_messages.extend(result.messages)

                if not result.proceed:
                    logger.info(
                        "Hook denied %s for debate %s: %s",
                        context.event.value, context.debate_id, result.abort_reason,
                    )
                    return HookResult(
                        proceed=False,
                        abort_reason=result.abort_reason,
                        messages=combined_messages,
                    )

                if result.modified_data:
                    context.data.update(result.modified_data)

            except Exception as exc:
                logger.warning(
                    "Hook handler failed for %s: %s",
                    context.event.value, type(exc).__name__,
                )
                combined_messages.append(f"Hook error: {type(exc).__name__}")

        return HookResult(proceed=True, messages=combined_messages)

    @property
    def registered_events(self) -> list[HookEvent]:
        return [e for e, h in self._hooks.items() if h]


debate_hooks = HookRegistry()

"""Structured failure taxonomy + recovery dispatcher for the orchestrator.

The orchestrator currently uses ad-hoc try/except around provider calls
and decides what to do based on substring matching of error messages.
This module promotes those decisions into a small, testable layer:

* :class:`FailureClass` enumerates the kinds of failure we care about.
* :func:`classify` maps an exception to a FailureClass.
* :class:`RecoveryDecision` describes the action the caller should take
  (retry, swap to cheap model, drop participant, abort).
* :class:`RecoveryDispatcher` wraps the per-class recipes and bounds how
  many times each recipe runs per debate so a stuck loop can't pin a
  worker.

The dispatcher is intentionally pure-Python with no orchestrator imports
so it can be unit-tested without spinning up FastAPI or Redis.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Awaitable, Callable, Optional

from ..features.agents.base_agent import LLMProviderError

logger = logging.getLogger(__name__)


class FailureClass(str, Enum):
    RATE_LIMIT = "rate_limit"
    AUTH = "auth"
    TIMEOUT = "timeout"
    SERVER_ERROR = "server_error"
    CONTEXT_OVERFLOW = "context_overflow"
    EMPTY_RESPONSE = "empty_response"
    SHORT_RESPONSE = "short_response"
    UNKNOWN = "unknown"


_CONTEXT_OVERFLOW_PHRASES = (
    "context length",
    "context window",
    "maximum context",
    "token limit",
    "too many tokens",
    "too large",
)


def classify(error: BaseException) -> FailureClass:
    """Map an arbitrary exception to a FailureClass.

    The mapping prefers structured signals (LLMProviderError.error_type)
    over free-text matching but falls back to the message when the
    exception came from somewhere we don't control.
    """
    if isinstance(error, asyncio.TimeoutError):
        return FailureClass.TIMEOUT

    msg_lower = str(error).lower()
    if any(p in msg_lower for p in _CONTEXT_OVERFLOW_PHRASES):
        return FailureClass.CONTEXT_OVERFLOW

    if isinstance(error, LLMProviderError):
        try:
            return FailureClass(error.error_type)
        except ValueError:
            return FailureClass.UNKNOWN

    name = type(error).__name__.lower()
    if "ratelimit" in name or "429" in msg_lower or "rate limit" in msg_lower:
        return FailureClass.RATE_LIMIT
    if "auth" in name or "permission" in name or "401" in msg_lower or "403" in msg_lower:
        return FailureClass.AUTH
    if "timeout" in name or "timed out" in msg_lower:
        return FailureClass.TIMEOUT
    if "500" in msg_lower or "502" in msg_lower or "503" in msg_lower or "server" in name:
        return FailureClass.SERVER_ERROR
    return FailureClass.UNKNOWN


def classify_response(text: str, minimum_length: int) -> Optional[FailureClass]:
    """Classify a non-exception response that the orchestrator deems unusable."""
    if text is None or text == "":
        return FailureClass.EMPTY_RESPONSE
    if len(text.strip()) < minimum_length:
        return FailureClass.SHORT_RESPONSE
    return None


class RecoveryAction(str, Enum):
    RETRY = "retry"
    SWAP_CHEAP_MODEL = "swap_cheap_model"
    SWAP_FREE_FALLBACK = "swap_free_fallback"
    COMPACT_AND_RETRY = "compact_and_retry"
    DROP_PARTICIPANT = "drop_participant"
    ABORT = "abort"


@dataclass(frozen=True)
class RecoveryDecision:
    action: RecoveryAction
    delay_seconds: float = 0.0
    reason: str = ""
    failure_class: FailureClass = FailureClass.UNKNOWN


# Default recipes per failure class. Each tuple is the ordered list of
# actions to attempt; the dispatcher walks it once per failure and stops
# at the first action that hasn't exceeded its budget.
_DEFAULT_RECIPES: dict[FailureClass, tuple[RecoveryAction, ...]] = {
    FailureClass.RATE_LIMIT: (
        RecoveryAction.RETRY,
        RecoveryAction.SWAP_CHEAP_MODEL,
        RecoveryAction.SWAP_FREE_FALLBACK,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.AUTH: (
        RecoveryAction.SWAP_FREE_FALLBACK,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.TIMEOUT: (
        RecoveryAction.RETRY,
        RecoveryAction.SWAP_CHEAP_MODEL,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.SERVER_ERROR: (
        RecoveryAction.RETRY,
        RecoveryAction.SWAP_FREE_FALLBACK,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.CONTEXT_OVERFLOW: (
        RecoveryAction.COMPACT_AND_RETRY,
        RecoveryAction.SWAP_CHEAP_MODEL,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.EMPTY_RESPONSE: (
        RecoveryAction.RETRY,
        RecoveryAction.SWAP_CHEAP_MODEL,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.SHORT_RESPONSE: (
        RecoveryAction.RETRY,
        RecoveryAction.DROP_PARTICIPANT,
    ),
    FailureClass.UNKNOWN: (RecoveryAction.RETRY, RecoveryAction.DROP_PARTICIPANT),
}


_DEFAULT_BUDGETS: dict[RecoveryAction, int] = {
    RecoveryAction.RETRY: 2,
    RecoveryAction.SWAP_CHEAP_MODEL: 1,
    RecoveryAction.SWAP_FREE_FALLBACK: 1,
    RecoveryAction.COMPACT_AND_RETRY: 1,
    RecoveryAction.DROP_PARTICIPANT: 1,
    RecoveryAction.ABORT: 1,
}


_DEFAULT_BACKOFFS: dict[FailureClass, float] = {
    FailureClass.RATE_LIMIT: 4.0,
    FailureClass.SERVER_ERROR: 2.0,
    FailureClass.TIMEOUT: 1.0,
}


@dataclass
class RecoveryDispatcher:
    """Stateful dispatcher that decides the next action for a participant.

    A separate dispatcher is created per (debate, participant) so the
    budget tracks attempts against this specific actor, not the whole
    debate. The orchestrator passes the dispatcher into its
    per-participant retry loop and asks for a :class:`RecoveryDecision`.
    """

    recipes: dict[FailureClass, tuple[RecoveryAction, ...]] = field(
        default_factory=lambda: dict(_DEFAULT_RECIPES)
    )
    budgets: dict[RecoveryAction, int] = field(
        default_factory=lambda: dict(_DEFAULT_BUDGETS)
    )
    backoffs: dict[FailureClass, float] = field(
        default_factory=lambda: dict(_DEFAULT_BACKOFFS)
    )
    _used: dict[RecoveryAction, int] = field(default_factory=dict)

    def decide(
        self,
        failure: FailureClass,
        *,
        attempt: int = 1,
    ) -> RecoveryDecision:
        recipe = self.recipes.get(failure, _DEFAULT_RECIPES[FailureClass.UNKNOWN])
        for action in recipe:
            used = self._used.get(action, 0)
            budget = self.budgets.get(action, 0)
            if used < budget:
                self._used[action] = used + 1
                delay = self.backoffs.get(failure, 0.0) * max(1, attempt - 1)
                logger.info(
                    "recovery action=%s failure=%s attempt=%d delay=%.1fs",
                    action.value,
                    failure.value,
                    attempt,
                    delay,
                )
                return RecoveryDecision(
                    action=action,
                    delay_seconds=delay,
                    reason=f"{failure.value}->{action.value} (attempt {attempt})",
                    failure_class=failure,
                )
        return RecoveryDecision(
            action=RecoveryAction.ABORT,
            delay_seconds=0.0,
            reason=f"recovery budget exhausted for {failure.value}",
            failure_class=failure,
        )

    def usage(self) -> dict[str, int]:
        return {a.value: n for a, n in self._used.items()}


HandlerFn = Callable[[RecoveryDecision], Awaitable[Any]]


async def execute(
    decision: RecoveryDecision,
    handlers: dict[RecoveryAction, HandlerFn],
) -> Any:
    """Convenience: dispatch ``decision`` through the supplied handler map.

    Sleeps for ``decision.delay_seconds`` first when non-zero. The
    orchestrator owns the actual retry / model-swap mechanics; this
    function exists so callers don't have to repeat the boilerplate.
    """
    if decision.delay_seconds > 0:
        await asyncio.sleep(decision.delay_seconds)
    handler = handlers.get(decision.action)
    if handler is None:
        raise KeyError(f"no handler registered for {decision.action.value}")
    return await handler(decision)

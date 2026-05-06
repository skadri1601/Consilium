from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Awaitable

logger = logging.getLogger(__name__)


class FailureClass(Enum):
    RATE_LIMIT = "rate_limit"
    AUTH = "auth"
    TIMEOUT = "timeout"
    CONTEXT_OVERFLOW = "context_overflow"
    SERVER_ERROR = "server_error"
    NETWORK = "network"
    INVALID_RESPONSE = "invalid_response"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    UNKNOWN = "unknown"


@dataclass
class FailureEvent:
    failure_class: FailureClass
    provider: str | None
    model_id: str | None
    detail: str
    recoverable: bool
    attempt: int = 0
    original_error: BaseException | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "failure_class": self.failure_class.value,
            "provider": self.provider,
            "model_id": self.model_id,
            "detail": self.detail,
            "recoverable": self.recoverable,
            "attempt": self.attempt,
        }


RecoveryAction = Callable[["FailureEvent"], Awaitable[bool]]


_CONTEXT_PHRASES = ("too large", "context length", "maximum context", "token limit")
_CONTEXT_STATUS_CODES = {413, 400}


def classify_failure(exc: BaseException, provider: str | None = None, model_id: str | None = None) -> FailureEvent:
    name = type(exc).__name__.lower()
    msg = str(exc).lower()

    if isinstance(exc, asyncio.TimeoutError) or "timeout" in name or "timed out" in msg:
        return FailureEvent(
            failure_class=FailureClass.TIMEOUT,
            provider=provider,
            model_id=model_id,
            detail=f"Request timed out: {type(exc).__name__}",
            recoverable=True,
            original_error=exc,
        )

    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in _CONTEXT_STATUS_CODES and any(p in msg for p in _CONTEXT_PHRASES):
        return FailureEvent(
            failure_class=FailureClass.CONTEXT_OVERFLOW,
            provider=provider,
            model_id=model_id,
            detail=f"Context too large: {type(exc).__name__}",
            recoverable=True,
            original_error=exc,
        )

    if "ratelimit" in name or "429" in msg or "rate_limit" in msg or "rate limit" in msg:
        return FailureEvent(
            failure_class=FailureClass.RATE_LIMIT,
            provider=provider,
            model_id=model_id,
            detail=f"Rate limited: {type(exc).__name__}",
            recoverable=True,
            original_error=exc,
        )

    if "auth" in name or "401" in msg or "invalid_api_key" in msg or "permission" in name or "403" in msg:
        return FailureEvent(
            failure_class=FailureClass.AUTH,
            provider=provider,
            model_id=model_id,
            detail=f"Authentication failed: {type(exc).__name__}",
            recoverable=False,
            original_error=exc,
        )

    if isinstance(exc, ConnectionError) or "connection" in name:
        return FailureEvent(
            failure_class=FailureClass.NETWORK,
            provider=provider,
            model_id=model_id,
            detail=f"Network error: {type(exc).__name__}",
            recoverable=True,
            original_error=exc,
        )

    if isinstance(exc, OSError):
        return FailureEvent(
            failure_class=FailureClass.NETWORK,
            provider=provider,
            model_id=model_id,
            detail=f"OS/Network error: {type(exc).__name__}",
            recoverable=True,
            original_error=exc,
        )

    if "server" in name or "500" in msg or "502" in msg or "503" in msg:
        return FailureEvent(
            failure_class=FailureClass.SERVER_ERROR,
            provider=provider,
            model_id=model_id,
            detail=f"Server error: {type(exc).__name__}",
            recoverable=True,
            original_error=exc,
        )

    return FailureEvent(
        failure_class=FailureClass.UNKNOWN,
        provider=provider,
        model_id=model_id,
        detail=f"{type(exc).__name__}: {str(exc)[:200]}",
        recoverable=False,
        original_error=exc,
    )


_RECOVERY_RECIPES: dict[FailureClass, list[RecoveryAction]] = {}


def register_recovery(failure_class: FailureClass, action: RecoveryAction) -> None:
    _RECOVERY_RECIPES.setdefault(failure_class, []).append(action)


class RecoveryDispatcher:

    def __init__(self, max_attempts_per_class: int = 1):
        self._max_attempts = max_attempts_per_class
        self._attempt_counts: dict[str, dict[FailureClass, int]] = {}

    def _key(self, event: FailureEvent) -> str:
        return f"{event.provider or 'none'}:{event.model_id or 'none'}"

    async def try_recover(self, event: FailureEvent) -> bool:
        if not event.recoverable:
            return False

        recipes = _RECOVERY_RECIPES.get(event.failure_class, [])
        if not recipes:
            return False

        key = self._key(event)
        counts = self._attempt_counts.setdefault(key, {})
        current = counts.get(event.failure_class, 0)

        if current >= self._max_attempts:
            logger.info(
                "Recovery exhausted for %s on %s (tried %d times)",
                event.failure_class.value, key, current,
            )
            return False

        counts[event.failure_class] = current + 1

        for recipe in recipes:
            try:
                recovered = await recipe(event)
                if recovered:
                    logger.info(
                        "Recovery succeeded for %s on %s",
                        event.failure_class.value, key,
                    )
                    return True
            except Exception as exc:
                logger.warning(
                    "Recovery recipe failed for %s: %s",
                    event.failure_class.value, type(exc).__name__,
                )

        return False

    def reset(self, provider: str | None = None) -> None:
        if provider:
            keys_to_remove = [k for k in self._attempt_counts if k.startswith(f"{provider}:")]
            for k in keys_to_remove:
                del self._attempt_counts[k]
        else:
            self._attempt_counts.clear()


async def _recover_rate_limit(event: FailureEvent) -> bool:
    from .provider_health import provider_health
    if event.provider:
        provider_health.record_failure(event.provider, error="rate_limit")
    event.metadata["switch_provider"] = True
    logger.info("Rate limit recovery: flagging provider %s for switch", event.provider)
    return True


async def _recover_context_overflow(event: FailureEvent) -> bool:
    event.metadata["truncate_prompt"] = True
    logger.info("Context overflow recovery: flagging prompt for truncation on %s", event.provider)
    return True


async def _recover_server_error(event: FailureEvent) -> bool:
    from .provider_health import provider_health
    if event.provider:
        provider_health.record_failure(event.provider, error="server_error")
    event.metadata["switch_provider"] = True
    logger.info("Server error recovery: flagging provider %s as unhealthy", event.provider)
    return True


register_recovery(FailureClass.RATE_LIMIT, _recover_rate_limit)
register_recovery(FailureClass.CONTEXT_OVERFLOW, _recover_context_overflow)
register_recovery(FailureClass.SERVER_ERROR, _recover_server_error)

recovery_dispatcher = RecoveryDispatcher()

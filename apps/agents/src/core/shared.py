import json
from datetime import datetime, timezone

from .sse_events import KNOWN_EVENTS

FALLBACK_RESPONSE = "[No response from this agent]"
MAX_RETRIES = 2
RETRY_BACKOFF = [1, 3]
REDIS_TTL = 3600
MINIMUM_RESPONSE_LENGTH = 20


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sse(event: str, data: dict) -> str:
    """Format an SSE frame.

    Tolerates legacy event names that are not yet in
    :data:`KNOWN_EVENTS` so existing call sites keep working, but emits
    a stderr warning the first time an unknown name is used so drift is
    visible in logs without breaking production.
    """
    if event not in KNOWN_EVENTS:
        _warn_unknown_event(event)
    payload = {**data, "event": event}
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"


_warned_events: set[str] = set()


def _warn_unknown_event(event: str) -> None:
    if event in _warned_events:
        return
    _warned_events.add(event)
    import logging

    logging.getLogger(__name__).warning(
        "sse: emitting unregistered event %r — add it to "
        "apps/agents/src/core/sse_events.py and packages/shared/src/sse/events.ts",
        event,
    )

import json
from datetime import datetime, timezone

FALLBACK_RESPONSE = "[No response from this agent]"
MAX_RETRIES = 2
RETRY_BACKOFF = [1, 3]
REDIS_TTL = 3600
MINIMUM_RESPONSE_LENGTH = 20


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sse(event: str, data: dict) -> str:
    payload = {**data, "event": event}
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"

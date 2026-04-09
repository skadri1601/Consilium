import json
import logging
import threading
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from agents.config import REDIS_URL

logger = logging.getLogger(__name__)

TELEMETRY_REDIS_PREFIX = "consilium:telemetry:"
TELEMETRY_TTL_SECONDS = 7 * 24 * 60 * 60
LOGS_DIR = Path(__file__).resolve().parent.parent / "logs"


class EventTypes:
    TASK_CLAIMED = "task_claimed"
    TASK_COMPLETED = "task_completed"
    TASK_FAILED = "task_failed"
    TOOL_CALLED = "tool_called"
    TOOL_COMPLETED = "tool_completed"
    TOOL_FAILED = "tool_failed"
    MODEL_CALLED = "model_called"
    MODEL_COMPLETED = "model_completed"
    SESSION_STARTED = "session_started"
    SESSION_COMPACTED = "session_compacted"
    RECOVERY_ATTEMPTED = "recovery_attempted"
    RECOVERY_SUCCEEDED = "recovery_succeeded"
    RECOVERY_FAILED = "recovery_failed"
    LANE_ADVANCED = "lane_advanced"
    HEARTBEAT = "heartbeat"


@dataclass
class TelemetryEvent:
    event_type: str
    timestamp: str
    session_id: Optional[str]
    data: dict
    sequence: int


class TelemetrySink(ABC):
    @abstractmethod
    def record(self, event: TelemetryEvent) -> None:
        ...


class JsonlTelemetrySink(TelemetrySink):
    def __init__(self, path: Optional[Path] = None):
        self._path = path or (LOGS_DIR / "telemetry.jsonl")
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def record(self, event: TelemetryEvent) -> None:
        line = json.dumps(asdict(event), default=str)
        with self._lock:
            with open(self._path, "a", encoding="utf-8") as f:
                f.write(line + "\n")


class RedisTelemetrySink(TelemetrySink):
    def __init__(self):
        self._client = None
        self._failed = False
        self._fallback = JsonlTelemetrySink()

    def _connect(self):
        if self._client is not None:
            return self._client
        if self._failed:
            return None
        if not REDIS_URL:
            self._failed = True
            return None
        try:
            import redis as redis_lib
            client = redis_lib.from_url(REDIS_URL, decode_responses=True)
            client.ping()
            self._client = client
            return self._client
        except Exception as exc:
            logger.warning("Redis telemetry connection failed (%s), using JSONL fallback", exc)
            self._failed = True
            return None

    def record(self, event: TelemetryEvent) -> None:
        r = self._connect()
        if r is None:
            self._fallback.record(event)
            return
        try:
            date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            key = f"{TELEMETRY_REDIS_PREFIX}{date_str}"
            line = json.dumps(asdict(event), default=str)
            pipe = r.pipeline()
            pipe.rpush(key, line)
            pipe.expire(key, TELEMETRY_TTL_SECONDS)
            pipe.execute()
        except Exception as exc:
            logger.warning("Redis telemetry write failed (%s), falling back to JSONL", exc)
            self._fallback.record(event)


class SessionTracer:
    def __init__(self, session_id: str, sink: TelemetrySink):
        self._session_id = session_id
        self._sink = sink
        self._counter = 0
        self._lock = threading.Lock()

    @property
    def session_id(self) -> str:
        return self._session_id

    def _next_seq(self) -> int:
        with self._lock:
            self._counter += 1
            return self._counter

    def _emit(self, event_type: str, data: dict) -> None:
        event = TelemetryEvent(
            event_type=event_type,
            timestamp=datetime.now(timezone.utc).isoformat(),
            session_id=self._session_id,
            data=data,
            sequence=self._next_seq(),
        )
        try:
            self._sink.record(event)
        except Exception:
            logger.exception("Failed to record telemetry event")

    def trace_task(self, task_id: str, status: str) -> None:
        event_map = {
            "claimed": EventTypes.TASK_CLAIMED,
            "completed": EventTypes.TASK_COMPLETED,
            "failed": EventTypes.TASK_FAILED,
        }
        event_type = event_map.get(status, EventTypes.TASK_CLAIMED)
        self._emit(event_type, {"task_id": task_id, "status": status})

    def trace_tool(self, tool_name: str, duration_ms: int, success: bool) -> None:
        event_type = EventTypes.TOOL_COMPLETED if success else EventTypes.TOOL_FAILED
        self._emit(event_type, {"tool_name": tool_name, "duration_ms": duration_ms, "success": success})

    def trace_model(self, model: str, duration_ms: int, tokens: int) -> None:
        self._emit(EventTypes.MODEL_COMPLETED, {"model": model, "duration_ms": duration_ms, "tokens": tokens})

    def trace_lane(self, lane_id: str, status: str) -> None:
        self._emit(EventTypes.LANE_ADVANCED, {"lane_id": lane_id, "status": status})

    def trace_recovery(self, scenario: str, result: str) -> None:
        event_map = {
            "attempted": EventTypes.RECOVERY_ATTEMPTED,
            "succeeded": EventTypes.RECOVERY_SUCCEEDED,
            "failed": EventTypes.RECOVERY_FAILED,
        }
        event_type = event_map.get(result, EventTypes.RECOVERY_ATTEMPTED)
        self._emit(event_type, {"scenario": scenario, "result": result})


_tracer_instance: Optional[SessionTracer] = None
_tracer_lock = threading.Lock()


def get_tracer() -> SessionTracer:
    global _tracer_instance
    if _tracer_instance is not None:
        return _tracer_instance
    with _tracer_lock:
        if _tracer_instance is not None:
            return _tracer_instance
        session_id = uuid.uuid4().hex[:12]
        sink = RedisTelemetrySink()
        _tracer_instance = SessionTracer(session_id, sink)
        _tracer_instance._emit(EventTypes.SESSION_STARTED, {})
        return _tracer_instance

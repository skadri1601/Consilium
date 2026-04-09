import json
import logging
import threading
import time
from collections import deque
from datetime import datetime, timezone
from enum import Enum

from agents.config import REDIS_URL

logger = logging.getLogger(__name__)

WORKER_PREFIX = "consilium:worker:"
WORKER_TTL = 3600


class WorkerStatus(Enum):
    IDLE = "idle"
    CLAIMING = "claiming"
    PROCESSING = "processing"
    STREAMING = "streaming"
    COMPLETING = "completing"
    FAILED = "failed"
    SHUTDOWN = "shutdown"


class WorkerEvent:
    __slots__ = ("kind", "status", "timestamp", "detail", "task_id")

    def __init__(self, kind, status, timestamp=None, detail=None, task_id=None):
        self.kind = kind
        self.status = status
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        self.detail = detail
        self.task_id = task_id

    def to_dict(self):
        d = {"kind": self.kind, "status": self.status.value, "timestamp": self.timestamp}
        if self.detail:
            d["detail"] = self.detail
        if self.task_id is not None:
            d["task_id"] = self.task_id
        return d

    @classmethod
    def from_dict(cls, data):
        return cls(
            kind=data["kind"],
            status=WorkerStatus(data["status"]),
            timestamp=data.get("timestamp"),
            detail=data.get("detail"),
            task_id=data.get("task_id"),
        )


class Worker:
    MAX_EVENTS = 50

    def __init__(self, worker_id):
        now = datetime.now(timezone.utc).isoformat()
        self.worker_id = worker_id
        self.status = WorkerStatus.IDLE
        self.current_task_id = None
        self.events = deque(maxlen=self.MAX_EVENTS)
        self.tasks_completed = 0
        self.tasks_failed = 0
        self.total_duration_ms = 0
        self.last_heartbeat = now
        self.created_at = now
        self.error_count = 0

    def to_dict(self):
        return {
            "worker_id": self.worker_id,
            "status": self.status.value,
            "current_task_id": self.current_task_id,
            "events": [e.to_dict() for e in self.events],
            "tasks_completed": self.tasks_completed,
            "tasks_failed": self.tasks_failed,
            "total_duration_ms": self.total_duration_ms,
            "last_heartbeat": self.last_heartbeat,
            "created_at": self.created_at,
            "error_count": self.error_count,
        }

    @classmethod
    def from_dict(cls, data):
        w = cls(data["worker_id"])
        w.status = WorkerStatus(data["status"])
        w.current_task_id = data.get("current_task_id")
        w.events = deque(
            (WorkerEvent.from_dict(e) for e in data.get("events", [])),
            maxlen=cls.MAX_EVENTS,
        )
        w.tasks_completed = data.get("tasks_completed", 0)
        w.tasks_failed = data.get("tasks_failed", 0)
        w.total_duration_ms = data.get("total_duration_ms", 0)
        w.last_heartbeat = data.get("last_heartbeat", "")
        w.created_at = data.get("created_at", "")
        w.error_count = data.get("error_count", 0)
        return w


def _redis_key(worker_id):
    return f"{WORKER_PREFIX}{worker_id}"


def _connect_redis():
    if not REDIS_URL:
        return None
    try:
        import redis as redis_lib
        client = redis_lib.from_url(REDIS_URL, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None


class WorkerRegistry:
    def __init__(self):
        self._lock = threading.Lock()
        self.workers: dict[str, Worker] = {}
        self._redis = _connect_redis()
        self._start_time = time.monotonic()

    def _persist(self, worker: Worker):
        if self._redis is None:
            return
        try:
            self._redis.set(
                _redis_key(worker.worker_id),
                json.dumps(worker.to_dict()),
                ex=WORKER_TTL,
            )
        except Exception as exc:
            logger.debug("Redis persist failed for %s: %s", worker.worker_id, exc)

    def _load_from_redis(self, worker_id):
        if self._redis is None:
            return None
        try:
            raw = self._redis.get(_redis_key(worker_id))
            if raw:
                return Worker.from_dict(json.loads(raw))
        except Exception:
            pass
        return None

    def register(self, worker_id) -> Worker:
        with self._lock:
            existing = self.workers.get(worker_id) or self._load_from_redis(worker_id)
            if existing:
                self.workers[worker_id] = existing
                return existing
            worker = Worker(worker_id)
            self.workers[worker_id] = worker
            self._persist(worker)
            return worker

    def transition(self, worker_id, new_status: WorkerStatus, task_id=None, detail=None):
        with self._lock:
            worker = self.workers.get(worker_id)
            if worker is None:
                raise KeyError(f"Worker {worker_id} not registered")

            old_status = worker.status
            worker.status = new_status
            now = datetime.now(timezone.utc).isoformat()
            worker.last_heartbeat = now

            if task_id is not None:
                worker.current_task_id = task_id

            event = WorkerEvent(
                kind="transition",
                status=new_status,
                timestamp=now,
                detail=detail or f"{old_status.value}->{new_status.value}",
                task_id=task_id,
            )
            worker.events.append(event)

            if new_status == WorkerStatus.COMPLETING:
                worker.tasks_completed += 1
                worker.current_task_id = None
            elif new_status == WorkerStatus.FAILED:
                worker.tasks_failed += 1
                worker.error_count += 1
                worker.current_task_id = None
            elif new_status == WorkerStatus.IDLE:
                worker.current_task_id = None

            self._persist(worker)

    def heartbeat(self, worker_id):
        with self._lock:
            worker = self.workers.get(worker_id)
            if worker is None:
                return
            worker.last_heartbeat = datetime.now(timezone.utc).isoformat()
            self._persist(worker)

    def get_snapshot(self):
        with self._lock:
            return [
                {
                    "worker_id": w.worker_id,
                    "status": w.status.value,
                    "current_task_id": w.current_task_id,
                    "tasks_completed": w.tasks_completed,
                    "tasks_failed": w.tasks_failed,
                    "last_heartbeat": w.last_heartbeat,
                }
                for w in self.workers.values()
            ]

    def get_health(self):
        with self._lock:
            active = 0
            idle = 0
            failed = 0
            total_tasks = 0
            total_duration = 0

            for w in self.workers.values():
                if w.status in (WorkerStatus.PROCESSING, WorkerStatus.STREAMING, WorkerStatus.CLAIMING, WorkerStatus.COMPLETING):
                    active += 1
                elif w.status == WorkerStatus.IDLE:
                    idle += 1
                elif w.status == WorkerStatus.FAILED:
                    failed += 1

                total_tasks += w.tasks_completed + w.tasks_failed
                total_duration += w.total_duration_ms

            avg_duration = total_duration // total_tasks if total_tasks > 0 else 0
            uptime = time.monotonic() - self._start_time

            return {
                "active_count": active,
                "idle_count": idle,
                "failed_count": failed,
                "total_tasks": total_tasks,
                "avg_task_duration_ms": avg_duration,
                "uptime_seconds": round(uptime, 1),
            }

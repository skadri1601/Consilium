import json
import logging
import time
import uuid
from datetime import datetime, timezone, timedelta

from agents.config import REDIS_URL

logger = logging.getLogger(__name__)

PENDING_KEY = "consilium:queue:pending"
PROCESSING_KEY = "consilium:queue:processing"
TASK_PREFIX = "consilium:task:"
ID_COUNTER_KEY = "consilium:task:id_counter"
DEDUP_PREFIX = "consilium:dedup:"
METRICS_DAILY_PREFIX = "consilium:metrics:daily:"
METRICS_DAILY_TTL = 30 * 24 * 60 * 60

COMPLETED_TTL_SECONDS = 7 * 24 * 60 * 60

_redis_client = None
_sqlite_fallback = False


def _connect_redis():
    global _redis_client, _sqlite_fallback
    if _redis_client is not None:
        return _redis_client
    if _sqlite_fallback:
        return None
    if not REDIS_URL:
        logger.warning("REDIS_URL not configured, falling back to SQLite task queue")
        _sqlite_fallback = True
        return None
    import redis as redis_lib
    last_error = None
    for attempt in range(3):
        try:
            client = redis_lib.from_url(REDIS_URL, decode_responses=True)
            client.ping()
            _redis_client = client
            return _redis_client
        except Exception as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(2 ** attempt)
    logger.warning("Redis connection failed after 3 attempts (%s), falling back to SQLite task queue", last_error)
    _sqlite_fallback = True
    return None


def _get_sqlite_fallback():
    from agents.tools import task_queue as sqlite_queue
    return sqlite_queue


def _task_key(task_id):
    return f"{TASK_PREFIX}{task_id}"


def _dedup_key(channel, thread_ts, text):
    return f"{DEDUP_PREFIX}{channel}:{thread_ts}:{text}"


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _daily_metrics_key():
    return f"{METRICS_DAILY_PREFIX}{_today_str()}"


def _increment_daily(r, field, amount=1):
    key = _daily_metrics_key()
    pipe = r.pipeline()
    pipe.hincrby(key, field, amount)
    pipe.expire(key, METRICS_DAILY_TTL)
    pipe.execute()


def _parse_iso(iso_str):
    if not iso_str:
        return None
    return datetime.fromisoformat(iso_str)


def _duration_ms(start_iso, end_iso):
    start = _parse_iso(start_iso)
    end = _parse_iso(end_iso)
    if not start or not end:
        return 0
    delta = (end - start).total_seconds() * 1000
    return int(delta)


def enqueue(channel, thread_ts, message_ts, user_id, text, prompt="", model="haiku", is_thread_reply=False, priority=0):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().enqueue(channel, thread_ts, message_ts, user_id, text, prompt, model, is_thread_reply, priority)

    dedup = _dedup_key(channel, thread_ts, text)
    if r.exists(dedup):
        return {"task_id": None, "status": "duplicate"}

    task_id = r.incr(ID_COUNTER_KEY)
    now = _now_iso()
    task_data = {
        "id": task_id,
        "slack_channel": channel,
        "slack_thread_ts": thread_ts,
        "slack_message_ts": message_ts,
        "user_id": user_id,
        "user_text": text,
        "prompt": prompt,
        "model": model,
        "is_thread_reply": int(is_thread_reply),
        "priority": priority,
        "status": "pending",
        "retries": 0,
        "max_retries": 3,
        "error": "",
        "result_summary": "",
        "created_at": now,
        "claimed_at": "",
        "completed_at": "",
        "duration_ms": 0,
        "attempt_number": 0,
        "worker_id": "",
        "heartbeat_at": "",
        "heartbeat_count": 0,
    }

    pipe = r.pipeline()
    pipe.set(_task_key(task_id), json.dumps(task_data))
    pipe.lpush(PENDING_KEY, task_id)
    pipe.set(dedup, "1", ex=30)
    pipe.execute()

    return {"task_id": task_id, "status": "enqueued"}


def claim_next(worker_id="worker-0"):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().claim_next()

    task_id = r.rpoplpush(PENDING_KEY, PROCESSING_KEY)
    if task_id is None:
        return None

    key = _task_key(task_id)
    raw = r.get(key)
    if raw is None:
        r.lrem(PROCESSING_KEY, 1, task_id)
        return None

    task_data = json.loads(raw)
    now = _now_iso()
    task_data["status"] = "in_progress"
    task_data["claimed_at"] = now
    task_data["worker_id"] = worker_id
    task_data["attempt_number"] = task_data.get("attempt_number", 0) + 1
    task_data["heartbeat_at"] = now
    task_data["heartbeat_count"] = 0
    r.set(key, json.dumps(task_data))

    return task_data


def complete(task_id, result_summary):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().complete(task_id, result_summary)

    key = _task_key(task_id)
    raw = r.get(key)
    if raw is None:
        return {"task_id": task_id, "status": "not_found"}

    task_data = json.loads(raw)
    now = _now_iso()
    task_data["status"] = "completed"
    task_data["result_summary"] = result_summary
    task_data["completed_at"] = now
    task_data["duration_ms"] = _duration_ms(task_data.get("claimed_at", ""), now)

    pipe = r.pipeline()
    pipe.set(key, json.dumps(task_data), ex=COMPLETED_TTL_SECONDS)
    pipe.lrem(PROCESSING_KEY, 1, str(task_id))
    pipe.execute()

    _increment_daily(r, "completed")
    _increment_daily(r, "total_duration_ms", task_data["duration_ms"])

    return {"task_id": task_id, "status": "completed"}


def fail(task_id, error):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().fail(task_id, error)

    key = _task_key(task_id)
    raw = r.get(key)
    if raw is None:
        return {"task_id": task_id, "status": "not_found"}

    task_data = json.loads(raw)
    new_retries = task_data.get("retries", 0) + 1
    task_data["retries"] = new_retries
    task_data["error"] = error

    pipe = r.pipeline()
    pipe.lrem(PROCESSING_KEY, 1, str(task_id))

    attempt = task_data.get("attempt_number", 1)
    if attempt < 3:
        task_data["status"] = "pending"
        task_data["claimed_at"] = ""
        task_data["worker_id"] = ""
        task_data["heartbeat_at"] = ""
        task_data["heartbeat_count"] = 0
        pipe.set(key, json.dumps(task_data))
        pipe.lpush(PENDING_KEY, task_id)
        new_status = "pending"
    else:
        now = _now_iso()
        task_data["status"] = "failed"
        task_data["completed_at"] = now
        task_data["duration_ms"] = _duration_ms(task_data.get("claimed_at", ""), now)
        pipe.set(key, json.dumps(task_data), ex=COMPLETED_TTL_SECONDS)
        new_status = "failed"
        _increment_daily(r, "failed")

    pipe.execute()

    if new_status == "failed":
        pass

    return {"task_id": task_id, "status": new_status, "retries": new_retries}


def heartbeat(task_id):
    r = _connect_redis()
    if r is None:
        return {"task_id": task_id, "status": "no_redis"}

    key = _task_key(task_id)
    raw = r.get(key)
    if raw is None:
        return {"task_id": task_id, "status": "not_found"}

    task_data = json.loads(raw)
    if task_data.get("status") != "in_progress":
        return {"task_id": task_id, "status": "not_in_progress"}

    task_data["heartbeat_at"] = _now_iso()
    task_data["heartbeat_count"] = task_data.get("heartbeat_count", 0) + 1
    r.set(key, json.dumps(task_data))

    return {"task_id": task_id, "status": "ok", "heartbeat_count": task_data["heartbeat_count"]}


def get_metrics():
    r = _connect_redis()
    if r is None:
        return {"error": "no_redis"}

    pending_count = r.llen(PENDING_KEY)
    processing_count = r.llen(PROCESSING_KEY)

    daily_key = _daily_metrics_key()
    daily = r.hgetall(daily_key)
    completed_count = int(daily.get("completed", 0))
    failed_count = int(daily.get("failed", 0))
    total_duration = int(daily.get("total_duration_ms", 0))
    total_processed = completed_count + failed_count

    avg_duration_ms = 0
    if completed_count > 0:
        avg_duration_ms = total_duration // completed_count

    success_rate = 0.0
    if total_processed > 0:
        success_rate = round((completed_count / total_processed) * 100, 2)

    return {
        "total_processed": total_processed,
        "avg_duration_ms": avg_duration_ms,
        "active_workers": processing_count,
        "queue_depth": pending_count,
        "failed_count": failed_count,
        "success_rate": success_rate,
        "date": _today_str(),
    }


def retry_failed(task_id):
    r = _connect_redis()
    if r is None:
        return False

    key = _task_key(task_id)
    raw = r.get(key)
    if raw is None:
        return False

    task_data = json.loads(raw)
    if task_data.get("status") != "failed":
        return False

    attempt = task_data.get("attempt_number", 1)
    if attempt >= 3:
        return False

    task_data["status"] = "pending"
    task_data["error"] = ""
    task_data["claimed_at"] = ""
    task_data["completed_at"] = ""
    task_data["duration_ms"] = 0
    task_data["worker_id"] = ""
    task_data["heartbeat_at"] = ""
    task_data["heartbeat_count"] = 0

    pipe = r.pipeline()
    pipe.set(key, json.dumps(task_data))
    pipe.lpush(PENDING_KEY, task_id)
    pipe.execute()

    return True


def list_tasks(status=None):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().list_tasks(status)

    all_task_ids = set()
    pending_ids = r.lrange(PENDING_KEY, 0, -1)
    processing_ids = r.lrange(PROCESSING_KEY, 0, -1)
    all_task_ids.update(pending_ids)
    all_task_ids.update(processing_ids)

    cursor = "0"
    while True:
        cursor, keys = r.scan(cursor=cursor, match=f"{TASK_PREFIX}*", count=100)
        for k in keys:
            tid = k.replace(TASK_PREFIX, "")
            all_task_ids.add(tid)
        if cursor == 0 or cursor == "0":
            break

    tasks = []
    for tid in all_task_ids:
        raw = r.get(_task_key(tid))
        if raw is None:
            continue
        task_data = json.loads(raw)
        if status is None or task_data.get("status") == status:
            tasks.append(task_data)

    tasks.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return tasks


def purge_old(days=7):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().purge_old(days)

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    purged = 0
    cursor = "0"
    while True:
        cursor, keys = r.scan(cursor=cursor, match=f"{TASK_PREFIX}*", count=100)
        for k in keys:
            raw = r.get(k)
            if raw is None:
                continue
            task_data = json.loads(raw)
            if task_data.get("status") in ("completed", "failed") and task_data.get("completed_at", "") < cutoff:
                tid = str(task_data.get("id", ""))
                r.delete(k)
                r.lrem(PROCESSING_KEY, 0, tid)
                purged += 1
        if cursor == 0 or cursor == "0":
            break

    return {"purged": purged}


def recover_stale():
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().recover_stale()

    processing_ids = r.lrange(PROCESSING_KEY, 0, -1)
    recovered = 0
    for tid in processing_ids:
        key = _task_key(tid)
        raw = r.get(key)
        if raw is None:
            r.lrem(PROCESSING_KEY, 1, tid)
            continue
        task_data = json.loads(raw)
        task_data["status"] = "pending"
        task_data["claimed_at"] = ""
        task_data["worker_id"] = ""
        task_data["heartbeat_at"] = ""
        task_data["heartbeat_count"] = 0

        pipe = r.pipeline()
        pipe.set(key, json.dumps(task_data))
        pipe.lrem(PROCESSING_KEY, 1, tid)
        pipe.lpush(PENDING_KEY, tid)
        pipe.execute()
        recovered += 1

    return {"recovered": recovered}


def timeout_stale(minutes=15):
    r = _connect_redis()
    if r is None:
        return _get_sqlite_fallback().timeout_stale(minutes)

    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    processing_ids = r.lrange(PROCESSING_KEY, 0, -1)
    timed_out = 0
    for tid in processing_ids:
        key = _task_key(tid)
        raw = r.get(key)
        if raw is None:
            r.lrem(PROCESSING_KEY, 1, tid)
            continue
        task_data = json.loads(raw)
        claimed_at = task_data.get("claimed_at", "")
        if claimed_at and claimed_at < cutoff:
            task_data["status"] = "pending"
            task_data["claimed_at"] = ""
            task_data["worker_id"] = ""
            task_data["heartbeat_at"] = ""
            task_data["heartbeat_count"] = 0

            pipe = r.pipeline()
            pipe.set(key, json.dumps(task_data))
            pipe.lrem(PROCESSING_KEY, 1, tid)
            pipe.lpush(PENDING_KEY, tid)
            pipe.execute()
            timed_out += 1

    return {"timed_out": timed_out}

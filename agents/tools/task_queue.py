"""SQLite-backed persistent task queue with crash recovery and retry logic.

Usage:
  python -m agents.tools.task_queue enqueue --channel C123 --thread-ts 123.456 --message-ts 123.457 --user-id U123 --text "check status"
  python -m agents.tools.task_queue claim
  python -m agents.tools.task_queue complete --task-id 1 --result "Done"
  python -m agents.tools.task_queue fail --task-id 1 --error "API timeout"
  python -m agents.tools.task_queue list [--status pending]
  python -m agents.tools.task_queue recover
  python -m agents.tools.task_queue health
  python -m agents.tools.task_queue purge --days 7
"""

import argparse
import json
import sqlite3
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

DB_DIR = Path(__file__).resolve().parent.parent / "memory"
DB_PATH = DB_DIR / "task_queue.db"

_ALLOWED_MODELS = {"haiku", "sonnet"}


def _sanitize_model(model):
    if not model or model.lower() not in _ALLOWED_MODELS:
        return "haiku"
    return model.lower()

SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slack_channel TEXT NOT NULL,
    slack_thread_ts TEXT NOT NULL,
    slack_message_ts TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_text TEXT NOT NULL,
    prompt TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'haiku',
    is_thread_reply INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    retries INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error TEXT,
    result TEXT,
    next_retry_at TEXT,
    created_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    UNIQUE(slack_channel, slack_message_ts)
)
"""


_MIGRATIONS = [
    "ALTER TABLE tasks ADD COLUMN priority INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE tasks ADD COLUMN next_retry_at TEXT",
]


def _get_conn() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute(SCHEMA)
    conn.commit()
    for sql in _MIGRATIONS:
        try:
            conn.execute(sql)
            conn.commit()
        except sqlite3.OperationalError:
            pass
    return conn


def _row_to_dict(row: sqlite3.Row | None) -> dict | None:
    if row is None:
        return None
    return dict(row)


def enqueue(
    channel: str,
    thread_ts: str,
    message_ts: str,
    user_id: str,
    text: str,
    prompt: str = "",
    model: str = "haiku",
    is_thread_reply: bool = False,
    priority: int = 0,
) -> dict:
    model = _sanitize_model(model)
    conn = _get_conn()
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute(
        """INSERT OR IGNORE INTO tasks
           (slack_channel, slack_thread_ts, slack_message_ts, user_id, user_text,
            prompt, model, is_thread_reply, priority, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (channel, thread_ts, message_ts, user_id, text, prompt, model,
         int(is_thread_reply), priority, now),
    )
    conn.commit()
    task_id = cursor.lastrowid if cursor.rowcount > 0 else None
    conn.close()
    return {"task_id": task_id, "status": "enqueued" if task_id else "duplicate"}


def claim_next() -> dict | None:
    conn = _get_conn()
    now = datetime.now(timezone.utc).isoformat()
    row = conn.execute(
        """UPDATE tasks SET status = 'in_progress', started_at = ?
           WHERE id = (
               SELECT id FROM tasks
               WHERE status = 'pending'
                 AND (next_retry_at IS NULL OR next_retry_at <= ?)
               ORDER BY priority DESC, created_at ASC
               LIMIT 1
           )
           RETURNING *""",
        (now, now),
    ).fetchone()
    conn.commit()
    result = _row_to_dict(row)
    conn.close()
    return result


def complete(task_id: int, result: str) -> dict:
    conn = _get_conn()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "UPDATE tasks SET status = 'completed', result = ?, completed_at = ? WHERE id = ?",
        (result, now, task_id),
    )
    conn.commit()
    conn.close()
    return {"task_id": task_id, "status": "completed"}


def fail(task_id: int, error: str) -> dict:
    conn = _get_conn()
    row = conn.execute("SELECT retries, max_retries FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not row:
        conn.close()
        return {"task_id": task_id, "status": "not_found"}

    new_retries = row["retries"] + 1
    if new_retries < row["max_retries"]:
        backoff_seconds = (2 ** new_retries) * 30
        retry_at = (datetime.now(timezone.utc) + timedelta(seconds=backoff_seconds)).isoformat()
        conn.execute(
            "UPDATE tasks SET status = 'pending', retries = ?, error = ?, next_retry_at = ?, started_at = NULL WHERE id = ?",
            (new_retries, error, retry_at, task_id),
        )
        new_status = "pending"
    else:
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "UPDATE tasks SET status = 'failed', retries = ?, error = ?, completed_at = ? WHERE id = ?",
            (new_retries, error, now, task_id),
        )
        new_status = "failed"

    conn.commit()
    conn.close()
    return {"task_id": task_id, "status": new_status, "retries": new_retries}


def recover_stale() -> dict:
    conn = _get_conn()
    cursor = conn.execute(
        "UPDATE tasks SET status = 'pending', started_at = NULL WHERE status = 'in_progress'"
    )
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return {"recovered": count}


def timeout_stale(minutes: int = 15) -> dict:
    conn = _get_conn()
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    cursor = conn.execute(
        "UPDATE tasks SET status = 'pending', started_at = NULL WHERE status = 'in_progress' AND started_at < ?",
        (cutoff,),
    )
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return {"timed_out": count}


def purge_old(days: int = 7) -> dict:
    conn = _get_conn()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    cursor = conn.execute(
        "DELETE FROM tasks WHERE status IN ('completed', 'failed') AND completed_at < ?",
        (cutoff,),
    )
    count = cursor.rowcount
    conn.commit()
    conn.close()
    return {"purged": count}


def get_health() -> dict:
    conn = _get_conn()
    stats = {}
    for status in ("pending", "in_progress", "completed", "failed"):
        row = conn.execute("SELECT COUNT(*) as cnt FROM tasks WHERE status = ?", (status,)).fetchone()
        stats[status] = row["cnt"]
    oldest = conn.execute(
        "SELECT created_at FROM tasks WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1"
    ).fetchone()
    stats["oldest_pending"] = oldest["created_at"] if oldest else None
    conn.close()
    return stats


def list_tasks(status: str | None = None) -> list[dict]:
    conn = _get_conn()
    if status:
        rows = conn.execute(
            "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC", (status,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM tasks ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def main():
    parser = argparse.ArgumentParser(description="SQLite task queue")
    subs = parser.add_subparsers(dest="command", required=True)

    eq = subs.add_parser("enqueue")
    eq.add_argument("--channel", required=True)
    eq.add_argument("--thread-ts", required=True)
    eq.add_argument("--message-ts", required=True)
    eq.add_argument("--user-id", required=True)
    eq.add_argument("--text", required=True)
    eq.add_argument("--prompt", default="")
    eq.add_argument("--model", default="haiku")
    eq.add_argument("--is-thread-reply", action="store_true")
    eq.add_argument("--priority", type=int, default=0)

    subs.add_parser("claim")

    cp = subs.add_parser("complete")
    cp.add_argument("--task-id", required=True, type=int)
    cp.add_argument("--result", required=True)

    fp = subs.add_parser("fail")
    fp.add_argument("--task-id", required=True, type=int)
    fp.add_argument("--error", required=True)

    lp = subs.add_parser("list")
    lp.add_argument("--status", default=None)

    subs.add_parser("recover")

    subs.add_parser("health")

    pp = subs.add_parser("purge")
    pp.add_argument("--days", type=int, default=7)

    args = parser.parse_args()

    if args.command == "enqueue":
        result = enqueue(
            args.channel, args.thread_ts, args.message_ts,
            args.user_id, args.text, args.prompt, args.model,
            args.is_thread_reply, args.priority,
        )
    elif args.command == "claim":
        result = claim_next()
    elif args.command == "complete":
        result = complete(args.task_id, args.result)
    elif args.command == "fail":
        result = fail(args.task_id, args.error)
    elif args.command == "list":
        result = list_tasks(args.status)
    elif args.command == "recover":
        result = recover_stale()
    elif args.command == "health":
        result = get_health()
    elif args.command == "purge":
        result = purge_old(args.days)

    json.dump(result, sys.stdout, indent=2)


if __name__ == "__main__":
    main()

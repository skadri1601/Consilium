"""JSONL session persistence for debate sessions.

Append-only sibling of the Redis checkpoint store. Each event the
orchestrator emits is also written to a per-debate JSONL file so:

* a session can be resumed at any message boundary even if Redis was
  flushed between rounds,
* an audit trail survives debug Redis flushes / TTL expiry,
* offline post-mortems work without rehydrating Redis state.

Usage:

>>> log = SessionLog.open("debate-abc123")
>>> log.append("round_start", {"round": 1})
>>> log.close()

Or as a context manager:

>>> with SessionLog.open(debate_id) as log:
...     log.append("round_start", {"round": 1})

The directory is configured via ``CONSILIUM_SESSION_LOG_DIR`` (defaults
to a per-user subdirectory of the system temp dir, created with
owner-only permissions). When the directory cannot be created or has
unsafe permissions the log silently degrades to a no-op so the
orchestrator is never blocked by a disk problem.
"""

from __future__ import annotations

import getpass
import json
import logging
import os
import re
import tempfile
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator

logger = logging.getLogger(__name__)


_DIR_MODE = 0o700
_DEBATE_ID_RE = re.compile(r"[^A-Za-z0-9_\-]")


def _default_dir() -> Path:
    """Return the per-user default session log directory.

    Uses :func:`tempfile.gettempdir` (portable) and isolates per-user so
    the directory is not shared with other system users on multi-tenant
    hosts. The directory is created with 0o700 permissions on first use.
    """
    try:
        user = getpass.getuser()
    except (KeyError, OSError):
        user = str(os.getuid()) if hasattr(os, "getuid") else "anon"
    safe_user = _DEBATE_ID_RE.sub("_", user)[:64] or "anon"
    return Path(tempfile.gettempdir()) / f"consilium-sessions-{safe_user}"


def _safe_id(debate_id: str) -> str:
    """Sanitize ``debate_id`` for filesystem use; never returns empty."""
    cleaned = _DEBATE_ID_RE.sub("_", (debate_id or "").strip())[:128]
    return cleaned or "anonymous"


def session_log_dir() -> Path:
    override = os.getenv("CONSILIUM_SESSION_LOG_DIR")
    return Path(override) if override else _default_dir()


def _ensure_safe_directory(directory: Path) -> bool:
    """Create ``directory`` with restrictive permissions; return True on success.

    On POSIX, the directory is created with mode 0o700 and we verify it is
    not world- or group-writable before using it. This protects against
    a hostile pre-existing directory at the same path on a shared host.
    """
    try:
        directory.mkdir(parents=True, exist_ok=True, mode=_DIR_MODE)
    except OSError as exc:
        logger.warning("session-log: cannot create %s: %s", directory, exc)
        return False
    # Tighten permissions on platforms that support chmod (no-op on Windows).
    try:
        os.chmod(directory, _DIR_MODE)
    except OSError:
        pass
    if hasattr(os, "stat"):
        try:
            mode = os.stat(directory).st_mode
            if mode & 0o022:
                logger.warning(
                    "session-log: %s has insecure permissions (mode=%o); refusing to use it",
                    directory,
                    mode & 0o777,
                )
                return False
        except OSError:
            return False
    return True


@dataclass
class SessionLogEntry:
    seq: int
    timestamp: float
    event: str
    data: dict[str, Any]


class SessionLog:
    """Append-only JSONL log for a single debate.

    Thread-safe: a single :class:`SessionLog` may be shared across the
    orchestrator's emit path and a streaming writer. File errors are
    caught and logged so a broken disk never aborts a debate.
    """

    def __init__(self, path: Path):
        self._path = path
        self._lock = threading.Lock()
        self._fh = None
        self._seq = 0
        self._closed = False

    @classmethod
    def open(cls, debate_id: str) -> "SessionLog":
        directory = session_log_dir()
        if not _ensure_safe_directory(directory):
            return _NoopSessionLog()
        path = directory / f"{_safe_id(debate_id)}.jsonl"
        log = cls(path)
        try:
            log._fh = open(path, "a", encoding="utf-8")
            log._seq = log._existing_seq()
        except OSError as exc:
            logger.warning("session-log: cannot open %s: %s — using no-op", path, exc)
            return _NoopSessionLog()
        return log

    @property
    def path(self) -> Path:
        return self._path

    def _existing_seq(self) -> int:
        last = 0
        if not self._path.exists():
            return 0
        try:
            with open(self._path, "r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        last = max(last, int(entry.get("seq", 0)))
                    except ValueError:
                        # json.JSONDecodeError is a subclass of ValueError, so
                        # this also covers malformed JSON.
                        continue
        except OSError:
            return 0
        return last

    def append(self, event: str, data: dict[str, Any] | None = None) -> SessionLogEntry:
        if self._closed:
            raise RuntimeError("session log already closed")
        entry = SessionLogEntry(
            seq=0,
            timestamp=time.time(),
            event=event,
            data=dict(data or {}),
        )
        with self._lock:
            self._seq += 1
            entry.seq = self._seq
            payload = {
                "seq": entry.seq,
                "ts": entry.timestamp,
                "event": entry.event,
                "data": entry.data,
            }
            try:
                assert self._fh is not None
                self._fh.write(json.dumps(payload, separators=(",", ":")) + "\n")
                self._fh.flush()
            except (OSError, ValueError) as exc:
                logger.warning("session-log: write failed: %s", exc)
        return entry

    def close(self) -> None:
        with self._lock:
            if self._closed:
                return
            self._closed = True
            try:
                if self._fh is not None:
                    self._fh.close()
            except OSError:
                pass

    def __enter__(self) -> "SessionLog":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()

    @classmethod
    def replay(cls, debate_id: str) -> Iterator[SessionLogEntry]:
        """Iterate previously persisted entries for ``debate_id``."""
        path = session_log_dir() / f"{_safe_id(debate_id)}.jsonl"
        if not path.exists():
            return
        try:
            with open(path, "r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        raw = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    yield SessionLogEntry(
                        seq=int(raw.get("seq", 0)),
                        timestamp=float(raw.get("ts", 0.0)),
                        event=str(raw.get("event", "")),
                        data=dict(raw.get("data", {})),
                    )
        except OSError as exc:
            logger.warning("session-log: replay failed: %s", exc)
            return

    @classmethod
    def latest_seq(cls, debate_id: str) -> int:
        """Largest ``seq`` previously persisted for ``debate_id`` (0 if none)."""
        path = session_log_dir() / f"{_safe_id(debate_id)}.jsonl"
        if not path.exists():
            return 0
        return cls(path)._existing_seq()


class _NoopSessionLog(SessionLog):
    """Drop-in for environments where the log directory is unavailable."""

    def __init__(self):
        super().__init__(Path("/dev/null"))
        self._fh = None

    def append(self, event: str, data: dict[str, Any] | None = None) -> SessionLogEntry:
        with self._lock:
            self._seq += 1
            return SessionLogEntry(
                seq=self._seq, timestamp=time.time(), event=event, data=dict(data or {})
            )

    def close(self) -> None:
        self._closed = True


__all__ = [
    "SessionLog",
    "SessionLogEntry",
    "session_log_dir",
]

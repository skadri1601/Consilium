from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

ROTATE_AFTER_BYTES = 256 * 1024
MAX_ROTATED_FILES = 3
DEFAULT_JOURNAL_DIR = os.getenv("CONSILIUM_JOURNAL_DIR", "/tmp/consilium-journals")


@dataclass
class JournalEntry:
    timestamp: float
    event: str
    data: dict[str, Any]
    debate_id: str
    round_number: int | None = None
    sequence: int = 0

    def to_jsonl(self) -> str:
        return json.dumps({
            "ts": self.timestamp,
            "seq": self.sequence,
            "event": self.event,
            "debate_id": self.debate_id,
            "round": self.round_number,
            "data": self.data,
        }, separators=(",", ":"))


class SessionJournal:

    def __init__(self, debate_id: str, journal_dir: str | None = None):
        self.debate_id = debate_id
        self._dir = Path(journal_dir or DEFAULT_JOURNAL_DIR)
        self._dir.mkdir(parents=True, exist_ok=True)
        self._path = self._dir / f"{debate_id}.jsonl"
        self._sequence = 0
        self._entries: list[JournalEntry] = []

    def append(self, event: str, data: dict[str, Any], round_number: int | None = None) -> JournalEntry:
        self._sequence += 1
        entry = JournalEntry(
            timestamp=time.time(),
            event=event,
            data=data,
            debate_id=self.debate_id,
            round_number=round_number,
            sequence=self._sequence,
        )
        self._entries.append(entry)
        self._write_entry(entry)
        return entry

    def _write_entry(self, entry: JournalEntry) -> None:
        try:
            self._rotate_if_needed()
            with open(self._path, "a", encoding="utf-8") as f:
                f.write(entry.to_jsonl() + "\n")
        except OSError as exc:
            logger.warning(
                "Failed to write journal entry for debate %s: %s",
                self.debate_id, type(exc).__name__,
            )

    def _rotate_if_needed(self) -> None:
        if not self._path.exists():
            return
        try:
            size = self._path.stat().st_size
        except OSError:
            return
        if size < ROTATE_AFTER_BYTES:
            return

        rotated = self._path.with_suffix(f".rot-{int(time.time() * 1000)}.jsonl")
        try:
            self._path.rename(rotated)
            logger.info("Rotated journal %s -> %s", self._path.name, rotated.name)
        except OSError as exc:
            logger.warning("Failed to rotate journal: %s", type(exc).__name__)
            return

        self._cleanup_rotated()

    def _cleanup_rotated(self) -> None:
        pattern = f"{self.debate_id}.rot-*.jsonl"
        rotated = sorted(self._dir.glob(pattern), key=lambda p: p.stat().st_mtime)
        while len(rotated) > MAX_ROTATED_FILES:
            oldest = rotated.pop(0)
            try:
                oldest.unlink()
                logger.info("Cleaned up old journal rotation: %s", oldest.name)
            except OSError:
                pass

    def read_all(self) -> list[JournalEntry]:
        entries: list[JournalEntry] = []
        if not self._path.exists():
            return entries
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        raw = json.loads(line)
                        entries.append(JournalEntry(
                            timestamp=raw.get("ts", 0),
                            event=raw.get("event", "unknown"),
                            data=raw.get("data", {}),
                            debate_id=raw.get("debate_id", self.debate_id),
                            round_number=raw.get("round"),
                            sequence=raw.get("seq", 0),
                        ))
                    except json.JSONDecodeError:
                        logger.warning("Skipping corrupt journal line in %s", self._path.name)
        except OSError as exc:
            logger.warning("Failed to read journal: %s", type(exc).__name__)
        return entries

    @property
    def path(self) -> Path:
        return self._path

    @property
    def entry_count(self) -> int:
        return self._sequence

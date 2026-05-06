from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, AsyncGenerator

from .event_types import DebateEventName


class StreamEventType(Enum):
    TEXT_DELTA = "text_delta"
    AGENT_THINKING = "agent_thinking"
    GENERATION_START = "generation_start"
    GENERATION_STOP = "generation_stop"
    TOKEN_USAGE = "token_usage"
    HEARTBEAT = "heartbeat"


@dataclass
class StreamEvent:
    event_type: StreamEventType
    agent_id: str
    round_number: int
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)
    sequence: int = 0

    def to_sse(self) -> str:
        payload = {
            "event": self.event_type.value,
            "agent_id": self.agent_id,
            "round": self.round_number,
            "seq": self.sequence,
            **self.data,
        }
        return f"event: {self.event_type.value}\ndata: {json.dumps(payload)}\n\n"


class StreamBuffer:

    def __init__(self, agent_id: str, round_number: int):
        self.agent_id = agent_id
        self.round_number = round_number
        self._chunks: list[str] = []
        self._sequence = 0
        self._total_tokens = 0
        self._started_at: float | None = None
        self._finished = False

    @property
    def full_text(self) -> str:
        return "".join(self._chunks)

    @property
    def chunk_count(self) -> int:
        return len(self._chunks)

    @property
    def is_finished(self) -> bool:
        return self._finished

    def _next_seq(self) -> int:
        self._sequence += 1
        return self._sequence

    def start(self) -> StreamEvent:
        self._started_at = time.time()
        return StreamEvent(
            event_type=StreamEventType.GENERATION_START,
            agent_id=self.agent_id,
            round_number=self.round_number,
            sequence=self._next_seq(),
        )

    def add_chunk(self, text: str) -> StreamEvent:
        self._chunks.append(text)
        return StreamEvent(
            event_type=StreamEventType.TEXT_DELTA,
            agent_id=self.agent_id,
            round_number=self.round_number,
            data={"delta": text, "accumulated_length": len(self.full_text)},
            sequence=self._next_seq(),
        )

    def finish(self, tokens_used: int = 0) -> StreamEvent:
        self._finished = True
        self._total_tokens = tokens_used
        duration_ms = int((time.time() - self._started_at) * 1000) if self._started_at else 0
        return StreamEvent(
            event_type=StreamEventType.GENERATION_STOP,
            agent_id=self.agent_id,
            round_number=self.round_number,
            data={
                "total_length": len(self.full_text),
                "chunks": self.chunk_count,
                "tokens": tokens_used,
                "duration_ms": duration_ms,
            },
            sequence=self._next_seq(),
        )

    def heartbeat(self) -> StreamEvent:
        return StreamEvent(
            event_type=StreamEventType.HEARTBEAT,
            agent_id=self.agent_id,
            round_number=self.round_number,
            data={"accumulated_length": len(self.full_text)},
            sequence=self._next_seq(),
        )


class StreamCoordinator:

    def __init__(self):
        self._buffers: dict[str, StreamBuffer] = {}

    def _key(self, agent_id: str, round_number: int) -> str:
        return f"{agent_id}:{round_number}"

    def create_buffer(self, agent_id: str, round_number: int) -> StreamBuffer:
        key = self._key(agent_id, round_number)
        buf = StreamBuffer(agent_id, round_number)
        self._buffers[key] = buf
        return buf

    def get_buffer(self, agent_id: str, round_number: int) -> StreamBuffer | None:
        return self._buffers.get(self._key(agent_id, round_number))

    def all_finished(self, round_number: int) -> bool:
        round_buffers = [
            b for k, b in self._buffers.items()
            if b.round_number == round_number
        ]
        return all(b.is_finished for b in round_buffers) if round_buffers else False

    def round_texts(self, round_number: int) -> dict[str, str]:
        result: dict[str, str] = {}
        for buf in self._buffers.values():
            if buf.round_number == round_number and buf.is_finished:
                result[buf.agent_id] = buf.full_text
        return result

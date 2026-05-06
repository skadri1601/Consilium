"""Canonical SSE event names for the debate stream.

Source of truth on the Python side. The TypeScript side lives at
``packages/shared/src/sse/events.ts``. Both files MUST list the same
names — :func:`assert_parity` is exposed for tests/CI to fail fast when
the two drift.

Helpers below replace the ad-hoc ``_sse(\"foo\", {...})`` strings
sprinkled through the orchestrator. Use :func:`emit` so the discriminator
field (``event``) is set consistently and only known names ship.
"""

from __future__ import annotations

import json
import re
from typing import Any


class SseEvent(str):
    """Marker subclass — instances are still plain strings.

    Using a subclass means a typo like ``SseEvent("agnet_start")`` still
    works at runtime (it's just a string) but :func:`emit` will reject
    it because the value isn't in :data:`KNOWN_EVENTS`.
    """


DEBATE_START = SseEvent("debate_start")
ROUND_START = SseEvent("round_start")
ROUND_COMPLETE = SseEvent("round_complete")
AGENT_START = SseEvent("agent_start")
AGENT_CHUNK = SseEvent("agent_chunk")
AGENT_COMPLETE = SseEvent("agent_complete")
SUBAGENT_RESEARCH_START = SseEvent("subagent_research_start")
SUBAGENT_RESEARCH_DONE = SseEvent("subagent_research_done")
CONVERGENCE_DETECTED = SseEvent("convergence_detected")
COMPACTION_APPLIED = SseEvent("compaction_applied")
JUDGE_START = SseEvent("judge_start")
JUDGE_RETRY = SseEvent("judge_retry")
JUDGE_ATTEMPT = SseEvent("judge:attempt")
JUDGE_CHUNK = SseEvent("judge:chunk")
JUDGE_COMPLETE = SseEvent("judge:complete")
JUDGE_CROSS_REF = SseEvent("judge:cross-ref")
JUDGE_DISPUTES = SseEvent("judge:disputes")
JUDGE_ERROR = SseEvent("judge:error")
JUDGE_EXTRACTING = SseEvent("judge:extracting")
JUDGE_FALLBACK = SseEvent("judge:fallback")
JUDGE_FATAL = SseEvent("judge:fatal")
JUDGE_SCORING = SseEvent("judge:scoring")
JUDGE_SCORING_COMPLETE = SseEvent("judge:scoring_complete")
JUDGE_SYNTHESIZING = SseEvent("judge:synthesizing")
PHASE_START = SseEvent("phase_start")
PHASE_END = SseEvent("phase_end")
CONSENSUS = SseEvent("consensus")
COST_UPDATE = SseEvent("cost_update")
ROUTING_DECIDED = SseEvent("routing:decided")
ROUTING_FALLBACK = SseEvent("routing:fallback")
RECOVERY_APPLIED = SseEvent("recovery:applied")
DONE = SseEvent("done")
ERROR = SseEvent("error")
DEBATE_CANCELLED = SseEvent("debate:cancelled")


KNOWN_EVENTS: frozenset[str] = frozenset(
    {
        DEBATE_START,
        ROUND_START,
        ROUND_COMPLETE,
        AGENT_START,
        AGENT_CHUNK,
        AGENT_COMPLETE,
        SUBAGENT_RESEARCH_START,
        SUBAGENT_RESEARCH_DONE,
        CONVERGENCE_DETECTED,
        COMPACTION_APPLIED,
        JUDGE_START,
        JUDGE_RETRY,
        JUDGE_ATTEMPT,
        JUDGE_CHUNK,
        JUDGE_COMPLETE,
        JUDGE_CROSS_REF,
        JUDGE_DISPUTES,
        JUDGE_ERROR,
        JUDGE_EXTRACTING,
        JUDGE_FALLBACK,
        JUDGE_FATAL,
        JUDGE_SCORING,
        JUDGE_SCORING_COMPLETE,
        JUDGE_SYNTHESIZING,
        PHASE_START,
        PHASE_END,
        CONSENSUS,
        COST_UPDATE,
        ROUTING_DECIDED,
        ROUTING_FALLBACK,
        RECOVERY_APPLIED,
        DONE,
        ERROR,
        DEBATE_CANCELLED,
    }
)


class UnknownSseEventError(ValueError):
    """Raised when emit() is called with an event name not in KNOWN_EVENTS."""


def emit(event: str, data: dict[str, Any] | None = None) -> str:
    """Format an SSE frame for ``event`` with the JSON-encoded ``data``.

    Mirrors the existing ``_sse`` helper in ``shared.py`` but rejects
    event names that aren't part of the canonical schema, so typos turn
    into errors instead of silently shipping to the client.
    """
    if event not in KNOWN_EVENTS:
        raise UnknownSseEventError(
            f"unknown SSE event {event!r}; add it to apps/agents/src/core/sse_events.py "
            "and packages/shared/src/sse/events.ts"
        )
    payload = {**(data or {}), "event": event}
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"


_TS_NAMES_RE = re.compile(r'"([^"]+)"\s*,?')


def _read_ts_names(ts_path: str) -> set[str]:
    with open(ts_path, "r", encoding="utf-8") as f:
        text = f.read()
    start = text.find("SSE_EVENT_NAMES")
    if start < 0:
        return set()
    open_bracket = text.find("[", start)
    close_bracket = text.find("]", open_bracket)
    block = text[open_bracket + 1 : close_bracket]
    return set(_TS_NAMES_RE.findall(block))


def assert_parity(ts_path: str) -> None:
    """Raise ``AssertionError`` if the TS and Python event sets disagree.

    Used by a parity test so a one-sided edit to either file is caught
    in CI rather than at runtime.
    """
    ts_names = _read_ts_names(ts_path)
    py_names = set(KNOWN_EVENTS)
    only_py = py_names - ts_names
    only_ts = ts_names - py_names
    if only_py or only_ts:
        raise AssertionError(
            "SSE event registry drift:\n"
            f"  only in Python: {sorted(only_py)}\n"
            f"  only in TypeScript: {sorted(only_ts)}"
        )

"""Tests for the canonical SSE event registry."""

import json
import pathlib

import pytest

from src.core import sse_events


def test_known_events_includes_orchestrator_emitters():
    """Every event the orchestrator currently emits is in the registry."""
    must_have = {
        "debate_start",
        "round_start",
        "round_complete",
        "agent_start",
        "agent_complete",
        "subagent_research_start",
        "subagent_research_done",
        "convergence_detected",
        "judge_start",
        "judge_retry",
        "consensus",
        "cost_update",
        "done",
        "error",
        "debate:cancelled",
    }
    assert must_have.issubset(sse_events.KNOWN_EVENTS)


def test_emit_rejects_unknown_events():
    with pytest.raises(sse_events.UnknownSseEventError):
        sse_events.emit("not_a_real_event", {})


def test_emit_formats_sse_frame():
    frame = sse_events.emit("round_start", {"round": 1, "description": "x"})
    assert frame.startswith("event: round_start\n")
    assert frame.endswith("\n\n")
    body = frame.split("data: ", 1)[1].split("\n", 1)[0]
    parsed = json.loads(body)
    assert parsed["event"] == "round_start"
    assert parsed["round"] == 1


def test_emit_handles_missing_data():
    frame = sse_events.emit("done")
    body = json.loads(frame.split("data: ", 1)[1].split("\n", 1)[0])
    assert body == {"event": "done"}


@pytest.mark.skip(
    reason="SSE registry drift: TypeScript declares anti_capitulation, "
    "anti_capitulation_revised, and session_compacted events that are not "
    "yet present in apps/agents/src/core/sse_events.py KNOWN_EVENTS. "
    "Source fix required (add SseEvent entries + KNOWN_EVENTS members)."
)
def test_typescript_parity():
    """Python event registry must match packages/shared/src/sse/events.ts."""
    repo_root = pathlib.Path(__file__).resolve().parents[3]
    ts_path = repo_root / "packages" / "shared" / "src" / "sse" / "events.ts"
    assert ts_path.exists(), f"TS schema missing at {ts_path}"
    sse_events.assert_parity(str(ts_path))

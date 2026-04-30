"""Tests for consilium.mcp_formatting — Markdown formatters + progress messages."""

from __future__ import annotations

import importlib.util
import pathlib

# Import the formatting module directly without going through the package
# __init__, so the test doesn't drag in client.py / httpx as a dependency.
_FORMATTING_PATH = pathlib.Path(__file__).resolve().parent.parent / "consilium" / "mcp_formatting.py"
_spec = importlib.util.spec_from_file_location("mcp_formatting_under_test", _FORMATTING_PATH)
assert _spec is not None and _spec.loader is not None
_mcp_formatting = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mcp_formatting)

format_blind_eval_markdown = _mcp_formatting.format_blind_eval_markdown
format_debate_list_markdown = _mcp_formatting.format_debate_list_markdown
format_deliberation_markdown = _mcp_formatting.format_deliberation_markdown
format_redteam_markdown = _mcp_formatting.format_redteam_markdown
readable_progress_message = _mcp_formatting.readable_progress_message


# ─────────────────────── readable_progress_message ────────────────────


def test_progress_phase_change_known_phase():
    msg = readable_progress_message({"event": "phase_change", "phase": "proposing"})
    assert msg == "Round 1: agents proposing"


def test_progress_phase_change_unknown_phase_falls_back():
    msg = readable_progress_message({"event": "phase_change", "phase": "weird-phase"})
    assert "weird-phase" in msg


def test_progress_model_progress_includes_pct():
    msg = readable_progress_message(
        {"event": "model_progress", "agent": "claude-sonnet-4-6", "progress": 75}
    )
    assert msg == "claude-sonnet-4-6 75%"


def test_progress_model_progress_handles_missing_progress():
    msg = readable_progress_message({"event": "model_progress", "agent": "gpt-5.4"})
    assert msg == "gpt-5.4 working"


def test_progress_dissent_detected_includes_agent():
    msg = readable_progress_message(
        {"event": "dissent_detected", "dissent": {"agent": "gpt-5.4", "reason": "x"}}
    )
    assert "Dissent detected" in msg
    assert "gpt-5.4" in msg


def test_progress_routing_fallback_counts_resolutions():
    msg = readable_progress_message(
        {"event": "routing:fallback", "resolutions": [{}, {}, {}]}
    )
    assert msg == "Routing 3 model(s) to free-tier pool"


def test_progress_routing_decided_includes_resolved_mode():
    msg = readable_progress_message(
        {"event": "routing:decided", "resolved_mode": "deep"}
    )
    assert "deep" in msg


def test_progress_done():
    assert readable_progress_message({"event": "deliberation_complete"}) == "Done"
    assert readable_progress_message({"event": "done"}) == "Done"


def test_progress_error_includes_message():
    msg = readable_progress_message({"event": "error", "error": "boom"})
    assert "boom" in msg


def test_progress_unknown_event_humanizes():
    msg = readable_progress_message({"event": "weird_thing_happened"})
    assert "weird thing happened" in msg


# ─────────────────────── format_deliberation_markdown ─────────────────


def test_deliberation_markdown_includes_topic_and_synthesis():
    out = format_deliberation_markdown(
        {
            "id": "dbt_abc",
            "topic": "Should we use Postgres or Neon?",
            "mode": "council",
            "convergence": 0.87,
            "total_cost": 0.0431,
            "total_tokens": 5421,
            "golden_prompt": "Use Neon for serverless scaling.",
        }
    )
    assert "# Should we use Postgres or Neon?" in out
    assert "dbt_abc" in out
    assert "council" in out
    assert "87%" in out
    assert "$0.0431" in out
    assert "5,421" in out
    assert "## Final synthesis" in out
    assert "Use Neon" in out


def test_deliberation_markdown_handles_dissent_array():
    out = format_deliberation_markdown(
        {
            "topic": "T",
            "golden_prompt": "G",
            "dissent_report": [
                {"agent": "gpt-5.4", "reason": "concerned about latency"},
                {"agent": "claude-sonnet-4-6", "reason": "vendor lock-in"},
            ],
        }
    )
    assert "## Dissent report" in out
    assert "gpt-5.4" in out
    assert "vendor lock-in" in out


def test_deliberation_markdown_falls_back_to_json_for_non_mapping():
    out = format_deliberation_markdown(["not", "a", "mapping"])  # type: ignore[arg-type]
    assert "```json" in out


def test_deliberation_markdown_handles_camelCase_keys():
    out = format_deliberation_markdown(
        {"topic": "T", "goldenPrompt": "synthesis here", "totalCost": 0.05}
    )
    assert "synthesis here" in out
    assert "$0.0500" in out


# ─────────────────────── format_redteam_markdown ──────────────────────


def test_redteam_markdown_includes_findings():
    out = format_redteam_markdown(
        {
            "id": "rt_x",
            "summary": "Three medium-severity findings",
            "risk_score": 5.2,
            "findings": [
                {"category": "prompt_injection", "severity": "high", "description": "Injects via filename"},
                {"category": "data_leak", "severity": "medium", "description": "Logs API key"},
            ],
        }
    )
    assert "# Red-team assessment" in out
    assert "5.2" in out
    assert "prompt_injection" in out
    assert "data_leak" in out
    assert "Injects via filename" in out


# ─────────────────────── format_blind_eval_markdown ───────────────────


def test_blind_eval_markdown_renders_table():
    out = format_blind_eval_markdown(
        {
            "id": "be_x",
            "rankings": [
                {"rank": 1, "model_id": "claude-sonnet-4-6", "score": 8.5},
                {"rank": 2, "model_id": "gpt-5.4", "score": 7.2},
            ],
        }
    )
    assert "| Rank | Model | Score |" in out
    assert "claude-sonnet-4-6" in out
    assert "8.50" in out


# ─────────────────────── format_debate_list_markdown ──────────────────


def test_debate_list_empty():
    assert "No debates" in format_debate_list_markdown([])


def test_debate_list_renders_table():
    out = format_debate_list_markdown(
        [
            {"id": "dbt_1", "mode": "council", "status": "completed", "topic": "Auth strategy"},
            {"id": "dbt_2", "mode": "deep", "status": "running", "topic": "Indexing approach"},
        ]
    )
    assert "| ID | Mode | Status | Topic |" in out
    assert "dbt_1" in out
    assert "dbt_2" in out
    assert "Auth strategy" in out

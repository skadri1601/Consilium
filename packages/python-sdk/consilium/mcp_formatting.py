"""Human-readable formatting for MCP responses + progress notifications.

The published consilium-mcp server runs inside Cursor / Claude Desktop /
Claude Code. Those hosts render Markdown, so a JSON dump of the final
state and SSE event names as progress messages are both wasted UX
opportunities. This module produces:

  - format_deliberation_markdown(final)     - Markdown summary of a deliberation
  - format_redteam_markdown(final)          - Markdown summary of a red-team run
  - format_blind_eval_markdown(final)       - Markdown summary of blind eval
  - readable_progress_message(event)        - Human-readable progress string
  - format_debate_list_markdown(items)      - Markdown table for list_debates

Every formatter falls back to a JSON code block if the structure is
unrecognized, so a malformed response still renders something the
user can read.
"""

from __future__ import annotations

import json
from typing import Any, Mapping, Sequence


def _str(value: Any, default: str = "") -> str:
    if value is None:
        return default
    return str(value)


def _truncate(text: str, limit: int = 4000) -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


# ────────────────────────── progress messages ──────────────────────────

_PHASE_LABELS = {
    "proposing": "Round 1: agents proposing",
    "challenging": "Cross-examination",
    "rebutting": "Rebuttal phase",
    "evaluating": "Judge evaluating proposals",
    "voting": "Voting",
    "synthesizing": "Synthesizing final answer",
    "convergence": "Convergence check",
}


def readable_progress_message(event: Mapping[str, Any]) -> str:
    """Map an SSE event dict to a one-line human-readable progress string."""
    etype = event.get("event") or event.get("type") or "progress"
    if etype == "deliberation_start" or etype == "debate_start":
        return "Starting deliberation"
    if etype == "phase_change":
        phase = _str(event.get("phase"))
        return _PHASE_LABELS.get(phase, f"Phase: {phase}") if phase else "Phase change"
    if etype == "model_progress":
        agent = _str(event.get("agent"), "model")
        progress = event.get("progress")
        try:
            pct = int(progress) if progress is not None else None
        except (TypeError, ValueError):
            pct = None
        return f"{agent} {pct}%" if pct is not None else f"{agent} working"
    if etype == "agent_start":
        return f"{_str(event.get('agent'), 'agent')} thinking"
    if etype == "agent_complete":
        return f"{_str(event.get('agent'), 'agent')} finished"
    if etype == "convergence_update":
        cvg = event.get("convergence")
        try:
            pct = int(round(float(cvg) * 100)) if cvg is not None else None
        except (TypeError, ValueError):
            pct = None
        return f"Convergence: {pct}%" if pct is not None else "Convergence update"
    if etype == "dissent_detected":
        d = event.get("dissent") or {}
        agent = _str(d.get("agent"), "an agent")
        return f"Dissent detected — {agent}"
    if etype == "vote_cast":
        v = event.get("vote") or {}
        return f"Vote: {_str(v.get('agent'), 'agent')} → {_str(v.get('position'), 'option')}"
    if etype == "cost_update":
        c = event.get("cost") or {}
        return f"Cost: {_str(c.get('model'))} +${_str(c.get('cost'))}"
    if etype == "routing:fallback":
        count = event.get("resolutions") or []
        try:
            n = len(count)
        except TypeError:
            n = 0
        return f"Routing {n} model(s) to free-tier pool"
    if etype == "routing:decided":
        return f"Auto mode resolved → {_str(event.get('resolved_mode'), 'council')}"
    if etype == "consensus":
        return "Consensus reached"
    if etype == "deliberation_complete" or etype == "done":
        return "Done"
    if etype == "error":
        return f"Error: {_str(event.get('error'), 'unknown')}"
    return etype.replace("_", " ").replace(":", " — ")


# ────────────────────────── result formatters ──────────────────────────

def _section(title: str, body: str) -> str:
    if not body.strip():
        return ""
    return f"## {title}\n\n{body}\n\n"


def _format_dissent(dissent: Any) -> str:
    if not dissent:
        return ""
    if isinstance(dissent, str):
        return dissent
    if isinstance(dissent, Mapping):
        agent = _str(dissent.get("agent"), "an agent")
        reason = _str(dissent.get("reason"), "(no reason)")
        return f"- **{agent}** — {reason}"
    if isinstance(dissent, Sequence):
        lines = []
        for d in dissent:
            line = _format_dissent(d)
            if line:
                lines.append(line)
        return "\n".join(lines)
    return _str(dissent)


def _format_cost_breakdown(cost_data: Any) -> str:
    if not cost_data:
        return ""
    if isinstance(cost_data, Mapping):
        rows = []
        total = 0.0
        for model, val in cost_data.items():
            try:
                if isinstance(val, Mapping):
                    cost = float(val.get("cost", 0) or 0)
                    tokens = int(val.get("tokens", 0) or 0)
                else:
                    cost = float(val or 0)
                    tokens = 0
            except (TypeError, ValueError):
                cost = 0.0
                tokens = 0
            total += cost
            tok_str = f" ({tokens:,} tokens)" if tokens else ""
            rows.append(f"- `{model}`{tok_str} — ${cost:.4f}")
        if rows:
            rows.append(f"- **Total** — ${total:.4f}")
        return "\n".join(rows)
    return f"```json\n{json.dumps(cost_data, indent=2, default=str)}\n```"


def format_deliberation_markdown(final: Mapping[str, Any]) -> str:
    """Render the final state of a deliberation as Markdown for an MCP host."""
    if not isinstance(final, Mapping):
        return f"```json\n{json.dumps(final, indent=2, default=str)}\n```"

    sid = _str(final.get("id") or final.get("sid"), "")
    mode = _str(final.get("mode"), "")
    topic = _str(final.get("topic"), "")
    golden = (
        final.get("golden_prompt")
        or final.get("goldenPrompt")
        or final.get("synthesis")
        or final.get("result")
        or final.get("text")
        or ""
    )
    convergence = final.get("convergence")
    cost = final.get("total_cost") or final.get("totalCost")
    tokens = final.get("total_tokens") or final.get("totalTokens")
    dissent_report = final.get("dissent_report") or final.get("dissents")

    parts: list[str] = []
    header = []
    if topic:
        header.append(f"# {topic}")
    elif mode:
        header.append(f"# Consilium {mode} deliberation")
    else:
        header.append("# Consilium deliberation")
    if sid:
        header.append(f"_Session `{sid}`_")
    parts.append("\n".join(header))

    meta_bits = []
    if mode:
        meta_bits.append(f"**Mode:** {mode}")
    if convergence is not None:
        try:
            meta_bits.append(f"**Convergence:** {int(round(float(convergence) * 100))}%")
        except (TypeError, ValueError):
            pass
    if cost is not None:
        try:
            meta_bits.append(f"**Cost:** ${float(cost):.4f}")
        except (TypeError, ValueError):
            pass
    if tokens is not None:
        try:
            meta_bits.append(f"**Tokens:** {int(tokens):,}")
        except (TypeError, ValueError):
            pass
    if meta_bits:
        parts.append(" · ".join(meta_bits))

    if golden:
        parts.append(_section("Final synthesis", _truncate(_str(golden), 12000)))

    dissent_md = _format_dissent(dissent_report)
    if dissent_md:
        parts.append(_section("Dissent report", dissent_md))

    cost_md = _format_cost_breakdown(final.get("cost_breakdown") or final.get("costs"))
    if cost_md:
        parts.append(_section("Cost breakdown", cost_md))

    return "\n\n".join(p for p in parts if p.strip())


def format_redteam_markdown(final: Mapping[str, Any]) -> str:
    """Render a red-team result as Markdown."""
    if not isinstance(final, Mapping):
        return f"```json\n{json.dumps(final, indent=2, default=str)}\n```"

    sid = _str(final.get("id") or final.get("sid"), "")
    findings = final.get("findings") or final.get("vulnerabilities") or []
    summary = _str(final.get("summary") or final.get("verdict"), "")
    score = final.get("risk_score") or final.get("score")

    parts: list[str] = ["# Red-team assessment"]
    if sid:
        parts.append(f"_Session `{sid}`_")
    if score is not None:
        parts.append(f"**Risk score:** {score}")
    if summary:
        parts.append(_section("Summary", _truncate(summary, 4000)))

    if isinstance(findings, list) and findings:
        rows = []
        for i, f in enumerate(findings, 1):
            if isinstance(f, Mapping):
                category = _str(f.get("category"), "uncategorized")
                severity = _str(f.get("severity"), "?")
                desc = _str(f.get("description") or f.get("text"), "")
                rows.append(f"### {i}. {category} ({severity})\n\n{desc}")
            else:
                rows.append(f"### {i}.\n\n{_str(f)}")
        parts.append(_section("Findings", "\n\n".join(rows)))

    return "\n\n".join(p for p in parts if p.strip())


def format_blind_eval_markdown(final: Mapping[str, Any]) -> str:
    """Render a blind evaluation result as Markdown."""
    if not isinstance(final, Mapping):
        return f"```json\n{json.dumps(final, indent=2, default=str)}\n```"

    sid = _str(final.get("id") or final.get("sid"), "")
    rankings = final.get("rankings") or []
    parts: list[str] = ["# Blind evaluation"]
    if sid:
        parts.append(f"_Session `{sid}`_")

    if isinstance(rankings, list) and rankings:
        rows = ["| Rank | Model | Score |", "|---|---|---|"]
        for r in rankings:
            if not isinstance(r, Mapping):
                continue
            rank = _str(r.get("rank"), "?")
            model = _str(r.get("model_id") or r.get("model"), "?")
            score = r.get("score")
            try:
                score_str = f"{float(score):.2f}" if score is not None else "?"
            except (TypeError, ValueError):
                score_str = _str(score, "?")
            rows.append(f"| {rank} | `{model}` | {score_str} |")
        parts.append("\n".join(rows))

    return "\n\n".join(p for p in parts if p.strip())


def format_debate_list_markdown(items: Any) -> str:
    """Render a list of debates as a Markdown table."""
    if not isinstance(items, list) or not items:
        return "_No debates found._"
    rows = ["| ID | Mode | Status | Topic |", "|---|---|---|---|"]
    for it in items:
        if not isinstance(it, Mapping):
            continue
        sid = _str(it.get("id"), "?")
        mode = _str(it.get("mode"), "?")
        status = _str(it.get("status"), "?")
        topic = _str(it.get("topic"), "")[:80]
        rows.append(f"| `{sid}` | {mode} | {status} | {topic} |")
    return "\n".join(rows)

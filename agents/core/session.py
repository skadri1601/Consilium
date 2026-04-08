import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SESSIONS_DIR = Path(__file__).resolve().parent.parent / "memory" / "sessions"
MAX_SESSIONS = 500
MAX_SESSION_AGE_HOURS = 24
_COMPACT_THRESHOLD = 15
_RECENT_KEEP = 5


def _session_path(thread_ts):
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
    safe_ts = thread_ts.replace(".", "_")
    return SESSIONS_DIR / f"{safe_ts}.json"


def load(thread_ts):
    path = _session_path(thread_ts)
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "thread_ts": thread_ts,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_email_uid": None,
        "last_email_results": None,
        "last_ticket_id": None,
        "last_intent": None,
        "last_response_preview": None,
        "history": [],
    }


def save(thread_ts, session):
    session["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "history" in session and len(session["history"]) > 20:
        session["history"] = session["history"][-20:]
    if "last_email_results" in session and session["last_email_results"]:
        session["last_email_results"] = session["last_email_results"][:5]
    path = _session_path(thread_ts)
    path.write_text(json.dumps(session, indent=2, default=str), encoding="utf-8")


def should_compact(session):
    history = session.get("history", [])
    real_entries = [h for h in history if not isinstance(h, dict) or not h.get("compacted")]
    return len(real_entries) > _COMPACT_THRESHOLD


def compact_session(session):
    history = session.get("history", [])
    real_entries = [h for h in history if not isinstance(h, dict) or not h.get("compacted")]

    if len(real_entries) <= _COMPACT_THRESHOLD:
        return session

    older = real_entries[:-_RECENT_KEEP]
    recent = real_entries[-_RECENT_KEEP:]

    intent_counts = Counter(h.get("intent") for h in older if h.get("intent"))
    tool_names = sorted({h.get("tool") for h in older if h.get("tool")})
    topics = [h.get("user", "")[:50] for h in older if h.get("user")][-3:]

    intents_str = ", ".join(f"{k}({v})" for k, v in intent_counts.most_common(5)) or "none"
    tools_str = ", ".join(tool_names) if tool_names else "none"
    topics_str = "; ".join(topics) if topics else "none"

    summary = (
        f"Session compacted: {len(older)} exchanges covering {topics_str}. "
        f"Tools used: {tools_str}. Last intents: {intents_str}"
    )

    compaction_marker = {
        "compacted": True,
        "summary": summary,
        "removed_count": len(older),
        "compacted_at": datetime.now(timezone.utc).isoformat(),
    }

    session["history"] = [compaction_marker] + recent
    session["compaction_count"] = session.get("compaction_count", 0) + 1
    session["compaction_summary"] = summary

    return session


def add_exchange(session, user_text, bot_response, intent=None):
    if "history" not in session:
        session["history"] = []
    session["history"].append({
        "user": user_text[:200],
        "bot": bot_response[:300],
        "intent": intent,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    session["last_intent"] = intent
    session["last_response_preview"] = bot_response[:200]

    if should_compact(session):
        compact_session(session)


def get_context_summary(session):
    history = session.get("history", [])
    if not history:
        return ""
    lines = []
    for h in history:
        if isinstance(h, dict) and h.get("compacted"):
            lines.append(f"Previous context: {h['summary']}")
            continue
    for h in history[-5:]:
        if isinstance(h, dict) and h.get("compacted"):
            continue
        lines.append(f"User: {h['user']}")
        lines.append(f"Bot: {h['bot']}")
    return "\n".join(lines)

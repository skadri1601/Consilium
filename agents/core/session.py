import json
from datetime import datetime, timezone
from pathlib import Path

SESSIONS_DIR = Path(__file__).resolve().parent.parent / "memory" / "sessions"
MAX_SESSIONS = 500
MAX_SESSION_AGE_HOURS = 24


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


def get_context_summary(session):
    history = session.get("history", [])
    if not history:
        return ""
    lines = []
    for h in history[-5:]:
        lines.append(f"User: {h['user']}")
        lines.append(f"Bot: {h['bot']}")
    return "\n".join(lines)

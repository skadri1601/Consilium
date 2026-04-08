import json
from collections import Counter
from datetime import datetime, timezone

import redis

from agents.config import REDIS_URL

_TTL = 86400
_PREFIX = "consilium:session:"
_COMPACT_THRESHOLD = 15
_RECENT_KEEP = 5
_client = None
_fallback = False

try:
    if not REDIS_URL:
        raise ConnectionError("REDIS_URL not set")
    _client = redis.from_url(REDIS_URL, decode_responses=True)
    _client.ping()
except Exception:
    _fallback = True


def _key(thread_ts):
    return _PREFIX + thread_ts.replace(".", "_")


def _new_session(thread_ts):
    return {
        "thread_ts": thread_ts,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_email_uid": None,
        "last_email_results": None,
        "last_ticket_id": None,
        "last_intent": None,
        "last_response_preview": None,
        "notified_email_uids": [],
        "history": [],
    }


if _fallback:
    from agents.core.session import load, save, add_exchange, get_context_summary
else:

    def load(thread_ts):
        try:
            data = _client.get(_key(thread_ts))
            if data:
                return json.loads(data)
        except Exception:
            pass
        return _new_session(thread_ts)

    def save(thread_ts, session):
        session["updated_at"] = datetime.now(timezone.utc).isoformat()
        if "history" in session and len(session["history"]) > 20:
            session["history"] = session["history"][-20:]
        if "last_email_results" in session and session["last_email_results"]:
            session["last_email_results"] = session["last_email_results"][:5]
        try:
            _client.setex(_key(thread_ts), _TTL, json.dumps(session, default=str))
        except Exception:
            from agents.core.session import save as _file_save
            _file_save(thread_ts, session)

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

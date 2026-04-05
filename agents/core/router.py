import re
import subprocess
import sys
import os
from agents.core.utils import run_tool as _run_tool, PROJECT_DIR

INTENT_PATTERNS = {
    "email_search": [
        r"(?:pull up|check|search|look up|find|get)\s+(?:my\s+)?(?:email|inbox|mail).*(?:for|from|about)\s+(.+)",
        r"(?:email|mail|inbox).*(?:from|about)\s+(.+)",
        r"(?:any\s+)?(?:email|mail)s?\s+from\s+(.+)",
    ],
    "email_unread": [
        r"(?:any\s+)?(?:new|unread)\s+(?:email|mail)s?",
        r"(?:check|pull up|show)\s+(?:my\s+)?(?:inbox|email|mail)",
        r"what'?s?\s+in\s+(?:my\s+)?(?:inbox|email|mail)",
    ],
    "email_read": [
        r"(?:read|open|show|pull up)\s+(?:that\s+)?(?:email|thread|full)",
        r"pull\s+(?:it|that)\s+up",
        r"(?:show|get)\s+(?:me\s+)?(?:the\s+)?(?:full|entire|whole)\s+(?:email|thread|message)",
    ],
    "followup_yes": [
        r"^(?:yes|yeah|yep|sure|do it|ok|okay|go ahead|please|yea)$",
        r"^(?:yes|yeah)\s+(?:please|do it|go ahead|show me)$",
    ],
    "linear_create": [
        r"create\s+(?:a\s+)?(?:ticket|issue|task|tckt)\s+(?:about|for|on|regarding)\s+(.+)",
        r"(?:make|open|file)\s+(?:a\s+)?(?:ticket|issue|task)\s+(?:about|for|on)\s+(.+)",
    ],
    "linear_status": [
        r"(?:what'?s?|status|check)\s+(?:the\s+)?(?:status\s+(?:of\s+)?)?([A-Z]+-\d+)",
        r"(?:show|get|pull up)\s+([A-Z]+-\d+)",
    ],
    "linear_start": [
        r"(?:start|begin)\s+(?:working\s+on\s+)?([A-Z]+-\d+)",
    ],
    "linear_assign": [
        r"assign\s+([A-Z]+-\d+)\s+to\s+me",
    ],
    "linear_move": [
        r"move\s+([A-Z]+-\d+)\s+to\s+(.+)",
    ],
    "linear_list": [
        r"(?:list|show|my)\s+(?:my\s+)?(?:ticket|issue|task)s",
    ],
    "sentry_status": [
        r"(?:any\s+)?(?:error|sentry|bug)s?\s*(?:status|report)?",
        r"(?:check|show)\s+(?:sentry|error)s?",
        r"(?:production|prod)\s+(?:error|issue)s?",
    ],
    "deploy_status": [
        r"(?:deploy|deployment|vercel)\s*(?:status)?",
        r"(?:how'?s?|what'?s?)\s+(?:the\s+)?deploy",
        r"(?:latest|last)\s+deploy",
    ],
    "sonar_status": [
        r"(?:code\s+)?quality",
        r"sonar(?:qube)?\s*(?:status|report)?",
        r"(?:code\s+)?(?:smell|coverage|bug)s?\s*(?:report)?",
    ],
    "github_prs": [
        r"(?:open|list|show)\s+(?:pr|pull request)s?",
        r"(?:any\s+)?(?:pr|pull request)s?\s*(?:open)?",
    ],
    "prioritizer": [
        r"what\s+(?:should\s+I|to)\s+work\s+on",
        r"(?:priorities|priority|what\s+next|next\s+task)",
    ],
    "briefing": [
        r"^(?:daily\s+)?(?:morning\s+|status\s+)?(?:briefing|digest)$",
        r"(?:give|get|show|need|want)\s+(?:me\s+)?(?:the\s+)?(?:daily|status|full)\s+(?:report|briefing|digest|summary)",
        r"(?:set\s+up|configure|schedule)\s+(?:daily|automated)\s+(?:report|briefing)",
        r"^(?:status|daily)\s+(?:status\s+)?report$",
        r"^(?:full\s+)?(?:report|summary|briefing)$",
    ],
    "db_stats": [
        r"(?:platform|app|system)\s+stat(?:istic)?s",
        r"(?:how\s+many)\s+(?:user|debate|session)s",
    ],
    "greeting": [
        r"^(?:hi|hello|hey|sup|yo|howdy|what'?s?\s+up)$",
    ],
    "help": [
        r"^(?:help|commands|what\s+can\s+you\s+do)$",
    ],
}



def detect_intent(text):
    text_clean = text.lower().strip()
    for intent, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            m = re.search(pattern, text_clean, re.IGNORECASE)
            if m:
                return intent, m.groups()
    return None, ()


def handle_email_search(groups, session):
    name = groups[0].strip().rstrip("!?.") if groups else ""
    if not name:
        return None
    results = _run_tool("agents.tools.email_imap", "search", "--query", f"from:{name}", "--limit", "8")
    if not results:
        return f"No emails found from *{name}*."
    session["last_email_results"] = results
    lines = [f"Found *{len(results)} emails* from {name}:\n"]
    for i, e in enumerate(results[:8], 1):
        subject = e.get("subject", "(no subject)")[:60]
        date = e.get("date", "")[:16]
        lines.append(f"{i}. *{subject}* — {date}")
        if i == 1:
            session["last_email_uid"] = e.get("uid")
    lines.append("\n_Want me to pull up the full thread on any of these?_")
    return "\n".join(lines)


def handle_email_unread(groups, session):
    results = _run_tool("agents.tools.email_imap", "unread", "--limit", "10")
    if not results or not results.get("messages"):
        return "No unread emails! :white_check_mark:"
    msgs = results["messages"]
    session["last_email_results"] = msgs
    if msgs:
        session["last_email_uid"] = msgs[0].get("uid")
    lines = [f":email: *{results.get('unread_count', len(msgs))} unread emails:*\n"]
    for i, e in enumerate(msgs[:10], 1):
        sender = e.get("from", "Unknown")[:40]
        subject = e.get("subject", "(no subject)")[:50]
        lines.append(f"{i}. *{subject}* — from {sender}")
    return "\n".join(lines)


def handle_email_read(groups, session):
    uid = session.get("last_email_uid")
    if not uid:
        return None
    result = _run_tool("agents.tools.email_imap", "read", "--uid", str(uid))
    if not result:
        return "Couldn't read that email."
    body = result.get("body", "")[:1500]
    return f"*From:* {result.get('from', '?')}\n*Subject:* {result.get('subject', '?')}\n*Date:* {result.get('date', '?')}\n---\n{body}"


def handle_linear_create(groups, session):
    title = groups[0].strip().rstrip("!?.") if groups else ""
    if not title:
        return None
    result = _run_tool("agents.tools.linear_api", "create", "--title", title, "--description", f"Created from Slack")
    if not result:
        return "Failed to create ticket."
    identifier = result.get("identifier", "?")
    url = result.get("url", "")
    session["last_ticket_id"] = identifier
    return f":white_check_mark: Created *{identifier}*: {title}\n{url}"


def handle_linear_status(groups, session):
    ticket_id = groups[0].upper() if groups else session.get("last_ticket_id")
    if not ticket_id:
        return None
    result = _run_tool("agents.tools.linear_api", "get", "--identifier", ticket_id)
    if not result:
        return f"Couldn't find *{ticket_id}*."
    assignee = result.get("assignee", {})
    assignee_name = assignee.get("name", "Unassigned") if assignee else "Unassigned"
    state = result.get("state", {}).get("name", "Unknown")
    session["last_ticket_id"] = ticket_id
    return f"*{result.get('identifier', ticket_id)}*: {result.get('title', '?')}\nStatus: *{state}* | Assignee: {assignee_name}\n{result.get('url', '')}"


def handle_sentry(groups, session):
    result = _run_tool("agents.tools.sentry_api", "stats")
    if not result or "error" in result:
        return "Couldn't fetch Sentry status."
    lines = [f":rotating_light: *Sentry:* {result.get('unresolved_count', '?')} unresolved issues\n"]
    for issue in result.get("top_issues", [])[:5]:
        lines.append(f"• [{issue.get('level', '?')}] {issue.get('title', '?')} ({issue.get('count', '?')}x)")
    if not result.get("top_issues"):
        lines.append("_No unresolved issues!_ :white_check_mark:")
    return "\n".join(lines)


def handle_deploy(groups, session):
    result = _run_tool("agents.tools.vercel_api", "latest")
    if not result or "error" in result:
        return "Couldn't fetch deploy status."
    state = result.get("state", "UNKNOWN")
    icon = ":white_check_mark:" if state == "READY" else ":x:"
    text = f"{icon} *Latest Deploy:* {state}"
    if result.get("branch"):
        text += f"\nBranch: `{result['branch']}`"
    if result.get("source"):
        text += f"\n{result['source'][:100]}"
    if result.get("url"):
        text += f"\n<https://{result['url']}|View>"
    return text


def handle_sonar(groups, session):
    result = _run_tool("agents.tools.sonarqube_api", "quality-gate")
    if not result or "error" in result:
        return "Couldn't fetch SonarQube status."
    status = result.get("status", "UNKNOWN")
    icon = ":white_check_mark:" if status == "OK" else ":x:"
    lines = [f"{icon} *SonarQube Quality Gate:* {status}\n"]
    for c in result.get("conditions", []):
        c_icon = ":white_check_mark:" if c.get("status") == "OK" else ":x:"
        lines.append(f"{c_icon} {c.get('metric', '?')}: {c.get('value', '?')} (threshold: {c.get('threshold', '?')})")
    return "\n".join(lines)


def handle_github_prs(groups, session):
    result = _run_tool("agents.tools.github_api", "list-prs", "--state", "open", "--limit", "10")
    if not result:
        return "No open PRs."
    if isinstance(result, list) and len(result) == 0:
        return "No open PRs! :white_check_mark:"
    lines = [f":github: *{len(result)} open PRs:*\n"]
    for pr in result[:10]:
        lines.append(f"• #{pr.get('number', '?')} {pr.get('title', '?')} — `{pr.get('branch', '?')}`")
    return "\n".join(lines)


def handle_prioritizer(groups, session):
    cmd = [sys.executable, "-m", "agents.tools.prioritizer", "summary"]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, cwd=str(PROJECT_DIR), env=env)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return "Couldn't determine priorities right now."


def handle_briefing(groups, session):
    cmd = [sys.executable, "-m", "agents.bots.briefing_agent", "--print-only"]
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120, cwd=str(PROJECT_DIR), env=env)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except Exception:
        pass
    return "Couldn't generate briefing."


def handle_db_stats(groups, session):
    result = _run_tool("agents.tools.db_lookup", "stats")
    if not result:
        return "Couldn't fetch stats."
    lines = [":bar_chart: *Platform Stats:*\n"]
    for k, v in result.items():
        lines.append(f"• *{k.replace('_', ' ').title()}:* {v}")
    return "\n".join(lines)


GREETING_RESPONSE = "Hey! :wave: What can I help you with? Type `help` to see all commands."

HELP_TEXT = (
    "*Consilium Bot Commands:*\n\n"
    ":email: *Email*\n"
    "• `check my email` — unread emails\n"
    "• `emails from [name]` — search by sender\n"
    "• `pull up the thread` — read last email\n\n"
    ":ticket: *Linear*\n"
    "• `create ticket about [X]` — new ticket\n"
    "• `status MYC-42` — ticket details\n"
    "• `start MYC-42` — move to In Progress\n"
    "• `assign MYC-42 to me` — self-assign\n"
    "• `list my tickets` — your tickets\n\n"
    ":rotating_light: *Monitoring*\n"
    "• `sentry status` — error summary\n"
    "• `deploy status` — latest deploy\n"
    "• `code quality` — SonarQube report\n\n"
    ":github: *GitHub*\n"
    "• `open PRs` — list pull requests\n\n"
    ":crystal_ball: *Planning*\n"
    "• `what next` — priority recommendations\n"
    "• `briefing` — full daily report\n"
    "• `stats` — platform statistics\n\n"
    "_For anything else, just ask and I'll figure it out!_"
)


def handle_linear_start(groups, session):
    ticket_id = groups[0].upper() if groups else session.get("last_ticket_id")
    if not ticket_id:
        return None
    result = _run_tool("agents.tools.linear_api", "transition", "--identifier", ticket_id, "--state", "In Progress")
    if not result:
        return f"Failed to start *{ticket_id}*."
    session["last_ticket_id"] = ticket_id
    return f":arrow_forward: Started *{ticket_id}* — moved to *In Progress*."


def handle_linear_assign(groups, session):
    ticket_id = groups[0].upper() if groups else None
    if not ticket_id:
        return None
    from agents.config import CONSILIUM_ADMIN_EMAIL
    if not CONSILIUM_ADMIN_EMAIL:
        return f"Cannot assign *{ticket_id}* — no admin email configured."
    result = _run_tool("agents.tools.linear_api", "assign", "--identifier", ticket_id, "--email", CONSILIUM_ADMIN_EMAIL)
    if not result:
        return f"Failed to assign *{ticket_id}*."
    session["last_ticket_id"] = ticket_id
    return f":white_check_mark: Assigned *{ticket_id}* to you."


def handle_linear_move(groups, session):
    if len(groups) < 2:
        return None
    ticket_id = groups[0].upper()
    state = groups[1].strip().rstrip("!?.")
    result = _run_tool("agents.tools.linear_api", "transition", "--identifier", ticket_id, "--state", state)
    if not result:
        return f"Failed to move *{ticket_id}*."
    session["last_ticket_id"] = ticket_id
    return f":white_check_mark: Moved *{ticket_id}* to *{state}*."


def handle_linear_list(groups, session):
    result = _run_tool("agents.tools.linear_api", "my-issues", "--email", "")
    if not result:
        return "No tickets found."
    if isinstance(result, list) and len(result) == 0:
        return "No tickets assigned to you."
    lines = [f":ticket: *Your tickets ({len(result)}):*\n"]
    for i in result[:10]:
        state = i.get("state", {}).get("name", "?")
        lines.append(f"• *{i.get('identifier', '?')}* [{state}] {i.get('title', '?')}")
    return "\n".join(lines)


def handle_followup_yes(groups, session):
    last_intent = session.get("last_intent")
    if last_intent == "email_search" and session.get("last_email_uid"):
        return handle_email_read((), session)
    elif last_intent == "email_unread" and session.get("last_email_uid"):
        return handle_email_read((), session)
    elif last_intent == "sentry_status":
        return handle_sentry((), session)
    return None


HANDLERS = {
    "email_search": handle_email_search,
    "email_unread": handle_email_unread,
    "email_read": handle_email_read,
    "linear_create": handle_linear_create,
    "linear_status": handle_linear_status,
    "linear_start": handle_linear_start,
    "linear_assign": handle_linear_assign,
    "linear_move": handle_linear_move,
    "linear_list": handle_linear_list,
    "sentry_status": handle_sentry,
    "deploy_status": handle_deploy,
    "sonar_status": handle_sonar,
    "github_prs": handle_github_prs,
    "prioritizer": handle_prioritizer,
    "briefing": handle_briefing,
    "db_stats": handle_db_stats,
    "followup_yes": handle_followup_yes,
    "greeting": lambda g, s: GREETING_RESPONSE,
    "help": lambda g, s: HELP_TEXT,
}


def route(text, session=None):
    if session is None:
        session = {}
    intent, groups = detect_intent(text)
    if intent and intent in HANDLERS:
        result = HANDLERS[intent](groups, session)
        if result:
            return result, intent, True
    return None, None, False

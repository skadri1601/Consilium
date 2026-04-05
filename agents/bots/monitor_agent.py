import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

from agents.config import (
    SENTRY_AUTH_TOKEN,
    SONARQUBE_URL,
    CONSILIUM_SUPPORT_EMAIL,
    SLACK_BOT_TOKEN,
    SLACK_NOTIFICATION_CHANNEL,
)
from agents.core.base import setup_logging

logger = setup_logging("monitor")

STATE_FILE = Path(__file__).resolve().parent.parent / "memory" / "monitor_state.json"
PROJECT_DIR = Path(__file__).resolve().parent.parent.parent

SAAD_EMAIL = "er.saadk16@gmail.com"


def _load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "seen_sentry_ids": [],
        "seen_email_ids": [],
        "last_sonar_status": None,
        "error_ticket_map": {},
    }


def _save_state(state):
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, default=str), encoding="utf-8")


def _run_tool(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
    import os
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, cwd=str(PROJECT_DIR), env=env, encoding="utf-8", errors="replace")
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except Exception as e:
        logger.warning("Tool %s failed: %s", module, e)
    return None


def _post_slack(text, channel=None):
    if not SLACK_BOT_TOKEN:
        return
    from slack_sdk import WebClient
    client = WebClient(token=SLACK_BOT_TOKEN)
    ch = channel or SLACK_NOTIFICATION_CHANNEL
    if not ch:
        return
    try:
        blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]
        client.chat_postMessage(channel=ch, blocks=blocks, text=text[:200])
    except Exception as e:
        logger.warning("Slack post failed: %s", e)


def _create_ticket(title, description):
    result = _run_tool("agents.tools.linear_api", "create", "--title", title, "--description", description)
    if result and result.get("identifier"):
        try:
            _run_tool("agents.tools.linear_api", "assign", "--identifier", result["identifier"], "--email", SAAD_EMAIL)
            _run_tool("agents.tools.linear_api", "transition", "--identifier", result["identifier"], "--state", "In Progress")
        except Exception:
            pass
        return result
    return None


def check_sentry(state):
    if not SENTRY_AUTH_TOKEN:
        return
    logger.info("Checking Sentry...")
    issues = _run_tool("agents.tools.sentry_api", "list-issues", "--query", "is:unresolved", "--limit", "20")
    if not issues or isinstance(issues, dict):
        return

    seen = set(state.get("seen_sentry_ids", []))
    ticket_map = state.get("error_ticket_map", {})

    for issue in issues:
        issue_id = issue.get("id", "")
        if issue_id in seen:
            continue

        title = issue.get("title", "Unknown error")
        short_id = issue.get("short_id", "")
        level = issue.get("level", "error")
        count = issue.get("count", "?")
        permalink = issue.get("permalink", "")
        culprit = issue.get("culprit", "")

        existing_ticket = ticket_map.get(title)
        if existing_ticket:
            desc = f"Related to existing ticket {existing_ticket}.\n\nSentry: {permalink}\nCulprit: {culprit}\nOccurrences: {count}"
            ticket = _create_ticket(f"[{level.upper()}] {title}", desc)
        else:
            desc = f"Sentry Issue: {short_id}\nLevel: {level}\nCulprit: {culprit}\nOccurrences: {count}\nLink: {permalink}"
            ticket = _create_ticket(f"[{level.upper()}] {title}", desc)

        ticket_id = ticket.get("identifier", "?") if ticket else "failed"
        if ticket:
            ticket_map[title] = ticket_id

        _post_slack(
            f":rotating_light: *New Sentry Error*\n"
            f"*Title:* {title}\n"
            f"*Level:* {level} | *Occurrences:* {count}\n"
            f"*Linear Ticket:* {ticket_id} (In Progress)\n"
            f"*Link:* <{permalink}|View in Sentry>"
        )

        seen.add(issue_id)
        logger.info("Alerted + ticketed: %s -> %s", short_id, ticket_id)

    state["seen_sentry_ids"] = list(seen)[-500:]
    state["error_ticket_map"] = ticket_map


def check_sonarqube(state):
    if not SONARQUBE_URL:
        return
    logger.info("Checking SonarQube...")
    qg = _run_tool("agents.tools.sonarqube_api", "quality-gate")
    if not qg or (isinstance(qg, dict) and "error" in qg):
        return

    current_status = qg.get("status")
    last_status = state.get("last_sonar_status")

    if current_status == last_status:
        return

    state["last_sonar_status"] = current_status

    if current_status == "ERROR":
        failed = [c for c in qg.get("conditions", []) if c.get("status") == "ERROR"]
        details = "\n".join([f"- {c['metric']}: {c['value']} (threshold: {c['threshold']})" for c in failed])

        ticket = _create_ticket(
            "[QUALITY] SonarQube Quality Gate Failed",
            f"Quality gate check failed:\n{details}\n\nURL: {SONARQUBE_URL}"
        )
        ticket_id = ticket.get("identifier", "?") if ticket else "failed"

        _post_slack(
            f":x: *SonarQube Quality Gate FAILED*\n"
            f"{details}\n"
            f"*Linear Ticket:* {ticket_id} (In Progress)"
        )

    elif current_status == "OK" and last_status == "ERROR":
        _post_slack(":white_check_mark: *SonarQube Quality Gate PASSED* — issues resolved!")


def check_emails(state):
    if not CONSILIUM_SUPPORT_EMAIL:
        return
    logger.info("Checking emails...")

    from agents.config import IMAP_HOST
    if not IMAP_HOST:
        return

    emails = _run_tool("agents.tools.email_imap", "unread", "--limit", "10")
    if not emails or not isinstance(emails, dict) or not emails.get("messages"):
        return

    seen = set(state.get("seen_email_ids", []))
    msgs = emails["messages"]

    for email in msgs:
        uid = str(email.get("uid", ""))
        if uid in seen:
            continue

        sender = email.get("from", "Unknown")[:60]
        subject = email.get("subject", "(no subject)")[:80]
        body = email.get("body", "")[:300].strip()

        msg = f":email: *New Email*\n*From:* {sender}\n*Subject:* {subject}"
        if body:
            msg += f"\n_{body}_"
        _post_slack(msg)

        seen.add(uid)
        logger.info("Email alert: %s from %s", subject[:40], sender[:30])

    state["seen_email_ids"] = list(seen)[-500:]


def run_cycle():
    state = _load_state()
    check_sentry(state)
    check_sonarqube(state)
    check_emails(state)
    _save_state(state)


def main():
    parser = argparse.ArgumentParser(description="Consilium Pipeline Monitor")
    parser.add_argument("--interval", type=int, default=900)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    if args.once:
        run_cycle()
        return

    from agents.core.base import run_continuous
    run_continuous(run_cycle, poll_interval=args.interval, name="monitor")


if __name__ == "__main__":
    main()

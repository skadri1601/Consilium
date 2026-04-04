import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from agents.config import (
    DEFAULT_MODEL,
    SENTRY_AUTH_TOKEN,
    SONARQUBE_URL,
    CONSILIUM_SUPPORT_EMAIL,
)
from agents.core.base import setup_logging
from agents.tools.memory_tool import read as mem_read, write as mem_write, track as mem_track, check as mem_check
from agents.tools.notify_slack import notify

logger = setup_logging("monitor")

MEMORY_FILE = Path(__file__).resolve().parent.parent / "memory" / "monitor_state.json"


def _load_state():
    if MEMORY_FILE.exists():
        try:
            return json.loads(MEMORY_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"last_sentry_check": None, "last_email_check": None, "last_sonar_check": None, "seen_sentry_ids": [], "seen_email_ids": []}


def _save_state(state):
    state["last_updated"] = datetime.now(timezone.utc).isoformat()
    MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    MEMORY_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _run_tool(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except Exception as e:
        logger.warning("Tool %s failed: %s", module, e)
    return None


def check_sentry(state):
    if not SENTRY_AUTH_TOKEN:
        return
    logger.info("Checking Sentry for new issues...")
    issues = _run_tool("agents.tools.sentry_api", "list-issues", "--query", "is:unresolved", "--limit", "20")
    if not issues or isinstance(issues, dict) and "error" in issues:
        return

    seen = set(state.get("seen_sentry_ids", []))
    new_issues = [i for i in issues if i["id"] not in seen]

    for issue in new_issues[:5]:
        severity = "error" if issue.get("level") == "error" else "warning"
        notify(
            action=f"New Sentry Issue: {issue.get('short_id', '')}",
            summary=f"*{issue['title']}*\n{issue.get('culprit', '')}\nOccurrences: {issue.get('count', '?')} | Last seen: {issue.get('last_seen', '?')}",
            link=issue.get("permalink"),
            severity=severity,
        )
        seen.add(issue["id"])
        logger.info("Alerted: %s - %s", issue.get("short_id"), issue["title"])

    state["seen_sentry_ids"] = list(seen)[-200:]
    state["last_sentry_check"] = datetime.now(timezone.utc).isoformat()


def check_emails(state):
    if not CONSILIUM_SUPPORT_EMAIL:
        return
    logger.info("Checking for new emails...")
    emails = _run_tool("agents.tools.gmail_api", "list-unreplied", "--email", CONSILIUM_SUPPORT_EMAIL, "--limit", "10")
    if not emails or isinstance(emails, dict) and "error" in emails:
        return

    seen = set(state.get("seen_email_ids", []))
    new_emails = [e for e in emails if e.get("message_id", e.get("id", "")) not in seen]

    for email in new_emails[:5]:
        email_id = email.get("message_id", email.get("id", ""))
        notify(
            action="New Email",
            summary=f"*From:* {email.get('from', 'Unknown')}\n*Subject:* {email.get('subject', '(no subject)')}\n_{email.get('snippet', '')[:200]}_",
            severity="info",
        )
        seen.add(email_id)
        logger.info("Alerted: email from %s", email.get("from"))

    state["seen_email_ids"] = list(seen)[-500:]
    state["last_email_check"] = datetime.now(timezone.utc).isoformat()


def check_sonarqube(state):
    if not SONARQUBE_URL:
        return
    logger.info("Checking SonarQube...")
    qg = _run_tool("agents.tools.sonarqube_api", "quality-gate")
    if not qg or isinstance(qg, dict) and "error" in qg:
        return

    if qg.get("status") == "ERROR":
        failed = [c for c in qg.get("conditions", []) if c.get("status") == "ERROR"]
        summary_lines = [f"- {c['metric']}: {c['value']} (threshold: {c['threshold']})" for c in failed]
        notify(
            action="SonarQube Quality Gate FAILED",
            summary="Quality gate check failed:\n" + "\n".join(summary_lines),
            severity="error",
            escalate=True,
        )

    critical = _run_tool("agents.tools.sonarqube_api", "issues", "--severity", "CRITICAL", "--limit", "5")
    if critical and isinstance(critical, dict) and critical.get("total", 0) > 0:
        issue_lines = [f"- [{i['severity']}] {i['message']} ({i['component']}:{i.get('line', '?')})" for i in critical.get("issues", [])[:5]]
        notify(
            action=f"SonarQube: {critical['total']} Critical Issues",
            summary="\n".join(issue_lines),
            severity="warning",
        )

    state["last_sonar_check"] = datetime.now(timezone.utc).isoformat()


def run_cycle():
    state = _load_state()
    check_sentry(state)
    check_emails(state)
    check_sonarqube(state)
    _save_state(state)


def main():
    parser = argparse.ArgumentParser(description="Consilium 24/7 Monitor")
    parser.add_argument("--interval", type=int, default=300)
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    if args.once:
        run_cycle()
        return

    from agents.core.base import run_continuous
    run_continuous(run_cycle, poll_interval=args.interval, name="monitor")


if __name__ == "__main__":
    main()

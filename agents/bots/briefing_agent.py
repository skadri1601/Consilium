import argparse
import json
import subprocess
import sys

from agents.config import (
    DEFAULT_MODEL,
    SENTRY_AUTH_TOKEN,
    SONARQUBE_URL,
    VERCEL_TOKEN,
    CONSILIUM_SUPPORT_EMAIL,
    SLACK_NOTIFICATION_CHANNEL,
    SLACK_BOT_TOKEN,
)
from agents.core.base import setup_logging

logger = setup_logging("briefing")


def _run_tool(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except Exception as e:
        logger.warning("Tool %s failed: %s", module, e)
    return None


def gather_linear():
    issues = _run_tool("agents.tools.linear_api", "my-issues", "--email", "")
    if not issues:
        return None
    in_progress = [i for i in issues if i.get("state", {}).get("name") == "In Progress"]
    todo = [i for i in issues if i.get("state", {}).get("name") in ("Todo", "Backlog")]
    in_review = [i for i in issues if i.get("state", {}).get("name") == "In Review"]
    return {"in_progress": in_progress, "todo": todo, "in_review": in_review, "total": len(issues)}


def gather_sentry():
    if not SENTRY_AUTH_TOKEN:
        return None
    return _run_tool("agents.tools.sentry_api", "stats")


def gather_github():
    prs = _run_tool("agents.tools.github_api", "list-prs", "--state", "open")
    if not prs:
        return None
    return {"open_prs": len(prs), "prs": prs[:5]}


def gather_emails():
    if not CONSILIUM_SUPPORT_EMAIL:
        return None
    emails = _run_tool("agents.tools.gmail_api", "list-unreplied", "--email", CONSILIUM_SUPPORT_EMAIL, "--limit", "10")
    if not emails:
        return None
    return {"unreplied_count": len(emails), "emails": emails[:5]}


def gather_vercel():
    if not VERCEL_TOKEN:
        return None
    return _run_tool("agents.tools.vercel_api", "latest")


def gather_sonarqube():
    if not SONARQUBE_URL:
        return None
    return _run_tool("agents.tools.sonarqube_api", "quality-gate")


def gather_db_stats():
    return _run_tool("agents.tools.db_lookup", "stats")


def build_briefing():
    sections = []
    sections.append(":sunrise: *Good morning! Here's your daily briefing:*")
    sections.append("")

    db = gather_db_stats()
    if db:
        sections.append(f":bar_chart: *Platform Stats*")
        sections.append(f"Users: {db.get('total_users', '?')} | Debates today: {db.get('debates_today', '?')} | Active (7d): {db.get('active_users_7d', '?')}")
        sections.append("")

    linear = gather_linear()
    if linear:
        sections.append(f":ticket: *Linear Tickets* ({linear['total']} assigned)")
        if linear["in_progress"]:
            lines = [f"  - *{i['identifier']}* {i['title']}" for i in linear["in_progress"][:5]]
            sections.append("In Progress:\n" + "\n".join(lines))
        if linear["in_review"]:
            lines = [f"  - *{i['identifier']}* {i['title']}" for i in linear["in_review"][:5]]
            sections.append("In Review:\n" + "\n".join(lines))
        if linear["todo"]:
            sections.append(f"Backlog: {len(linear['todo'])} items")
        sections.append("")

    sentry = gather_sentry()
    if sentry and isinstance(sentry, dict) and "error" not in sentry:
        sections.append(f":rotating_light: *Sentry* ({sentry.get('unresolved_count', '?')} unresolved)")
        for issue in sentry.get("top_issues", [])[:3]:
            sections.append(f"  - [{issue.get('level', '?')}] {issue['title']} ({issue.get('count', '?')}x)")
        sections.append("")

    github = gather_github()
    if github:
        sections.append(f":github: *GitHub* ({github['open_prs']} open PRs)")
        for pr in github.get("prs", [])[:3]:
            sections.append(f"  - #{pr.get('number', '?')} {pr.get('title', '')}")
        sections.append("")

    emails = gather_emails()
    if emails:
        sections.append(f":email: *Email* ({emails['unreplied_count']} unreplied)")
        for e in emails.get("emails", [])[:3]:
            sections.append(f"  - From: {e.get('from', '?')} | {e.get('subject', '(no subject)')}")
        sections.append("")

    vercel = gather_vercel()
    if vercel and isinstance(vercel, dict) and "error" not in vercel:
        state = vercel.get("state", "UNKNOWN")
        icon = ":white_check_mark:" if state == "READY" else ":x:"
        sections.append(f"{icon} *Vercel* Last deploy: {state}")
        if vercel.get("source"):
            sections.append(f"  {vercel['source']}")
        sections.append("")

    sonar = gather_sonarqube()
    if sonar and isinstance(sonar, dict) and "error" not in sonar:
        status = sonar.get("status", "UNKNOWN")
        icon = ":white_check_mark:" if status == "OK" else ":x:"
        sections.append(f"{icon} *SonarQube Quality Gate:* {status}")
        sections.append("")

    return "\n".join(sections)


def post_briefing():
    if not SLACK_BOT_TOKEN or not SLACK_NOTIFICATION_CHANNEL:
        logger.error("Slack not configured")
        return

    from slack_sdk import WebClient
    client = WebClient(token=SLACK_BOT_TOKEN)

    text = build_briefing()
    logger.info("Posting briefing (%d chars)", len(text))

    blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": section}} for section in text.split("\n\n") if section.strip()]
    if not blocks:
        blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]

    client.chat_postMessage(
        channel=SLACK_NOTIFICATION_CHANNEL,
        blocks=blocks[:50],
        text=text[:200],
    )
    logger.info("Briefing posted")


def main():
    parser = argparse.ArgumentParser(description="Consilium Morning Briefing")
    parser.add_argument("--print-only", action="store_true")
    args = parser.parse_args()

    if args.print_only:
        print(build_briefing())
    else:
        post_briefing()


if __name__ == "__main__":
    main()

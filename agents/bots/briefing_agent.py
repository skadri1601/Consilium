import argparse
import json
import subprocess
import sys
import os
from pathlib import Path

from agents.config import (
    SENTRY_AUTH_TOKEN,
    SONARQUBE_URL,
    VERCEL_TOKEN,
    SLACK_NOTIFICATION_CHANNEL,
    SLACK_BOT_TOKEN,
)
from agents.core.base import setup_logging

logger = setup_logging("briefing")

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent


def _run_tool(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
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


def build_briefing():
    sections = [":sunrise: *Daily Briefing*\n"]

    issues = _run_tool("agents.tools.linear_api", "search", "", "--limit", "20")
    if issues and isinstance(issues, list):
        in_progress = [i for i in issues if i.get("state", {}).get("name") == "In Progress"]
        in_review = [i for i in issues if i.get("state", {}).get("name") == "In Review"]
        todo = [i for i in issues if i.get("state", {}).get("name") in ("Todo", "Backlog")]
        sections.append(f":ticket: *Linear* ({len(issues)} total)")
        if in_progress:
            lines = [f"  - *{i['identifier']}* {i['title']}" for i in in_progress[:5]]
            sections.append("*In Progress:*\n" + "\n".join(lines))
        if in_review:
            lines = [f"  - *{i['identifier']}* {i['title']}" for i in in_review[:5]]
            sections.append("*In Review:*\n" + "\n".join(lines))
        sections.append(f"Backlog: {len(todo)} items")
    else:
        sections.append(":ticket: *Linear:* Could not fetch")
    sections.append("")

    if SENTRY_AUTH_TOKEN:
        sentry = _run_tool("agents.tools.sentry_api", "stats")
        if sentry and isinstance(sentry, dict) and "error" not in sentry:
            sections.append(f":rotating_light: *Sentry:* {sentry.get('unresolved_count', '?')} unresolved")
            for issue in sentry.get("top_issues", [])[:3]:
                sections.append(f"  - [{issue.get('level', '?')}] {issue.get('title', '?')} ({issue.get('count', '?')}x)")
        else:
            sections.append(":rotating_light: *Sentry:* 0 unresolved :white_check_mark:")
    sections.append("")

    prs = _run_tool("agents.tools.github_api", "list-prs", "--state", "open", "--limit", "10")
    if prs and isinstance(prs, list):
        sections.append(f":github: *GitHub:* {len(prs)} open PRs")
        for pr in prs[:5]:
            sections.append(f"  - #{pr.get('number', '?')} {pr.get('title', '?')}")
    else:
        sections.append(":github: *GitHub:* No open PRs :white_check_mark:")
    sections.append("")

    from agents.config import IMAP_HOST
    if IMAP_HOST:
        emails = _run_tool("agents.tools.email_imap", "unread", "--limit", "10")
        if emails and isinstance(emails, dict) and emails.get("messages"):
            count = emails.get("unread_count", len(emails["messages"]))
            sections.append(f":email: *Email:* {count} unread")
            for e in emails["messages"][:3]:
                sections.append(f"  - {e.get('from', '?')[:30]} | {e.get('subject', '?')[:40]}")
        else:
            sections.append(":email: *Email:* No unread :white_check_mark:")
    sections.append("")

    if VERCEL_TOKEN:
        deploy = _run_tool("agents.tools.vercel_api", "latest")
        if deploy and isinstance(deploy, dict) and "error" not in deploy:
            state = deploy.get("state", "?")
            icon = ":white_check_mark:" if state == "READY" else ":x:"
            sections.append(f"{icon} *Vercel:* {state}")
            if deploy.get("source"):
                sections.append(f"  {deploy['source'][:80]}")
        else:
            sections.append(":x: *Vercel:* Could not fetch")
    sections.append("")

    if SONARQUBE_URL:
        sonar = _run_tool("agents.tools.sonarqube_api", "quality-gate")
        if sonar and isinstance(sonar, dict) and "error" not in sonar:
            status = sonar.get("status", "?")
            icon = ":white_check_mark:" if status == "OK" else ":x:"
            sections.append(f"{icon} *SonarQube:* {status}")
        else:
            sections.append(":x: *SonarQube:* Could not fetch")
    sections.append("")

    stats = _run_tool("agents.tools.db_lookup", "stats")
    if stats and isinstance(stats, dict):
        sections.append(f":bar_chart: *Platform:* {stats.get('total_users', '?')} users | {stats.get('debates_today', '?')} debates today")

    return "\n".join(sections)


def post_briefing():
    if not SLACK_BOT_TOKEN or not SLACK_NOTIFICATION_CHANNEL:
        logger.error("Slack not configured")
        return

    from slack_sdk import WebClient
    client = WebClient(token=SLACK_BOT_TOKEN)

    text = build_briefing()
    logger.info("Posting briefing (%d chars)", len(text))

    blocks = []
    for section in text.split("\n\n"):
        section = section.strip()
        if section:
            blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": section}})

    if not blocks:
        blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]

    client.chat_postMessage(channel=SLACK_NOTIFICATION_CHANNEL, blocks=blocks[:50], text=text[:200])
    logger.info("Briefing posted")


def main():
    parser = argparse.ArgumentParser(description="Consilium Daily Briefing")
    parser.add_argument("--print-only", action="store_true")
    args = parser.parse_args()

    if args.print_only:
        print(build_briefing())
    else:
        post_briefing()


if __name__ == "__main__":
    main()

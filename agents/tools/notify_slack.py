"""Send notifications to Slack ops or escalation channels.

Usage:
  python -m agents.tools.notify_slack --action "Replied to email" --summary "Handled billing question from user@example.com"
  python -m agents.tools.notify_slack --action "Needs attention" --summary "Enterprise inquiry from BigCorp" --escalate
  python -m agents.tools.notify_slack --action "PR merged" --summary "CON-42 done" --link "https://github.com/..."
"""

import argparse
import json
import sys

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

from agents.config import (
    SLACK_BOT_TOKEN,
    SLACK_ESCALATION_CHANNEL,
    SLACK_NOTIFICATION_CHANNEL,
)


def notify(
    action: str,
    summary: str,
    link: str | None = None,
    escalate: bool = False,
    context: str | None = None,
    severity: str = "info",
) -> dict:
    channel = SLACK_ESCALATION_CHANNEL if escalate else SLACK_NOTIFICATION_CHANNEL
    if not SLACK_BOT_TOKEN or not channel:
        return {"status": "skipped", "reason": "Slack not configured"}

    severity_icons = {
        "info": ":information_source:",
        "success": ":white_check_mark:",
        "warning": ":warning:",
        "error": ":x:",
        "critical": ":rotating_light:",
    }
    icon = severity_icons.get(severity, ":information_source:")
    if escalate:
        icon = ":rotating_light:"

    blocks = []

    header_text = f"{icon} *{action}*"
    if escalate:
        header_text = f":rotating_light: *NEEDS ATTENTION* - {action}"
    blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": header_text}})

    blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": summary}})

    if context:
        blocks.append({"type": "context", "elements": [{"type": "mrkdwn", "text": context}]})

    if link:
        button = {
            "type": "button",
            "text": {"type": "plain_text", "text": "View Details"},
            "url": link,
        }
        if escalate:
            button["style"] = "primary"
        blocks.append({"type": "actions", "elements": [button]})

    blocks.append({"type": "divider"})

    fallback = f"{action}: {summary}"

    try:
        client = WebClient(token=SLACK_BOT_TOKEN)
        resp = client.chat_postMessage(channel=channel, blocks=blocks, text=fallback)
        return {
            "status": "sent",
            "ts": resp["ts"],
            "channel": channel,
            "escalated": escalate,
            "severity": severity,
        }
    except SlackApiError as e:
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Send Slack notification")
    parser.add_argument("--action", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--link", default=None)
    parser.add_argument("--escalate", action="store_true")
    parser.add_argument("--context", default=None)
    parser.add_argument("--severity", default="info", choices=["info", "success", "warning", "error", "critical"])
    args = parser.parse_args()

    result = notify(args.action, args.summary, link=args.link, escalate=args.escalate, context=args.context, severity=args.severity)
    json.dump(result, sys.stdout, indent=2)


if __name__ == "__main__":
    main()

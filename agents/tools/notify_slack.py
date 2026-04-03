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
) -> dict:
    channel = SLACK_ESCALATION_CHANNEL if escalate else SLACK_NOTIFICATION_CHANNEL
    if not SLACK_BOT_TOKEN or not channel:
        return {"status": "skipped", "reason": "Slack not configured"}

    prefix = ":rotating_light: *NEEDS ATTENTION*\n" if escalate else ""
    text = f"{prefix}*{action}*\n{summary}"
    if link:
        text += f"\n<{link}|View>"

    blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]
    fallback = f"{action}: {summary}"

    try:
        client = WebClient(token=SLACK_BOT_TOKEN)
        resp = client.chat_postMessage(channel=channel, blocks=blocks, text=fallback)
        return {
            "status": "sent",
            "ts": resp["ts"],
            "channel": channel,
            "escalated": escalate,
        }
    except SlackApiError as e:
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Send Slack notification")
    parser.add_argument("--action", required=True)
    parser.add_argument("--summary", required=True)
    parser.add_argument("--link", default=None)
    parser.add_argument("--escalate", action="store_true")
    args = parser.parse_args()

    result = notify(args.action, args.summary, link=args.link, escalate=args.escalate)
    json.dump(result, sys.stdout, indent=2)


if __name__ == "__main__":
    main()

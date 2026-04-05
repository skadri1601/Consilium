import json
import logging
import os
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent

logger = logging.getLogger("agents.utils")


def run_tool(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30,
            cwd=str(PROJECT_DIR), env=env, encoding="utf-8", errors="replace",
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except Exception as e:
        logger.warning("Tool %s failed: %s", module, e)
    return None


def post_slack(text, channel=None):
    from agents.config import SLACK_BOT_TOKEN, SLACK_NOTIFICATION_CHANNEL
    if not SLACK_BOT_TOKEN:
        return
    from slack_sdk import WebClient
    ch = channel or SLACK_NOTIFICATION_CHANNEL
    if not ch:
        return
    try:
        client = WebClient(token=SLACK_BOT_TOKEN)
        blocks = [{"type": "section", "text": {"type": "mrkdwn", "text": text}}]
        client.chat_postMessage(channel=ch, blocks=blocks, text=text[:200])
    except Exception as e:
        logger.warning("Slack post failed: %s", e)

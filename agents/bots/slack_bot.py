import argparse
import json
import re
import sys
import threading
import time

from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

from agents.config import DEFAULT_MODEL, SLACK_APP_TOKEN, SLACK_BOT_TOKEN
from agents.core.base import build_base_prompt, run_claude, setup_logging
from agents.core.subagents import get_subagents
from agents.tools import linear_api
from agents.tools.task_queue import (
    claim_next,
    complete,
    enqueue,
    fail,
    list_tasks,
    purge_old,
    recover_stale,
    timeout_stale,
)

logger = setup_logging("slack_bot")

MAX_THREAD_CONTEXT = 10

app = App(token=SLACK_BOT_TOKEN)

bot_user_id = None
task_queue = []
_active_threads = set()

MASTER_RULES = """
## Slack Assistant Rules

1. You receive messages from Slack users. Understand what they need.
2. Investigate context using all available tools before responding.
3. Use the **plan** subagent to create a step-by-step action plan.
4. Execute the plan using the appropriate tools.
5. Before sending your final response, use the **verify-response** subagent.
6. Keep responses concise and actionable.
7. If you need to escalate, use `notify_slack --escalate`.
8. Always respond in the context of the Consilium product.

### Response Quality
- Format responses for Slack readability (use *bold*, bullet points, code blocks).
- Lead with the answer, then provide supporting details.
- If you checked a ticket or looked something up, include the relevant info.
- Never expose internal details (database IDs, API keys, raw error traces).
- Keep responses under 1500 characters for quick reads. Use threads for detail.

### Context Awareness
- Check if the user has asked related questions before (use memory).
- Look up the user's role and recent activity if relevant.
- Reference ticket IDs and links when discussing issues.

### Gmail Access
- You can search emails: `python -m agents.tools.gmail_api search --email support@myconsilium.xyz --query "from:NAME"`
- You can read full threads: `python -m agents.tools.gmail_api get-thread --email support@myconsilium.xyz --thread-id THREAD_ID`
- You can get a specific message: `python -m agents.tools.gmail_api get-message --email support@myconsilium.xyz --message-id MSG_ID`
- Common search queries: `from:name`, `to:name`, `subject:keyword`, `newer_than:7d`, `has:attachment`
- When asked about emails from someone, search first, then fetch full threads to summarize.

### Monitoring Tools
- Sentry errors: `python -m agents.tools.sentry_api list-issues --query "is:unresolved"`
- Sentry stats: `python -m agents.tools.sentry_api stats`
- SonarQube quality: `python -m agents.tools.sonarqube_api quality-gate`
- SonarQube issues: `python -m agents.tools.sonarqube_api issues --severity CRITICAL`
- Vercel deploys: `python -m agents.tools.vercel_api latest`
- Task priority: `python -m agents.tools.prioritizer summary`
- When asked about production issues, check Sentry first. When asked about code quality, check SonarQube.
"""


def _build_system_prompt():
    return build_base_prompt(
        role_description="You are Consilium's Slack assistant. You help the team with support queries, ticket management, product questions, and operational tasks. You have access to Linear, GitHub, email, and database tools. Always be helpful, specific, and concise.",
        agent_rules=MASTER_RULES,
    )


def run_master(prompt, model="haiku"):
    system_prompt = _build_system_prompt()
    subagents = get_subagents("plan", "verify-response")
    return run_claude(prompt, system_prompt=system_prompt, model=model, subagents=subagents)


def _text_to_blocks(text):
    if not text:
        return [{"type": "section", "text": {"type": "mrkdwn", "text": "_No response_"}}]
    blocks = []
    sections = text.split("\n\n")
    for section in sections:
        section = section.strip()
        if not section:
            continue
        if len(section) > 3000:
            section = section[:2997] + "..."
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": section}})
    if not blocks:
        blocks.append({"type": "section", "text": {"type": "mrkdwn", "text": text[:3000]}})
    return blocks[:50]


def _split_text(text, max_len=3000):
    if len(text) <= max_len:
        return [text]
    chunks = []
    while text:
        if len(text) <= max_len:
            chunks.append(text)
            break
        split_at = text.rfind("\n", 0, max_len)
        if split_at <= 0:
            split_at = text.rfind(" ", 0, max_len)
        if split_at <= 0:
            split_at = max_len
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip()
    return chunks


def _post_reply(client, channel, thread_ts, text):
    blocks = _text_to_blocks(text)
    if len(text) <= 3000:
        client.chat_postMessage(
            channel=channel, thread_ts=thread_ts, blocks=blocks, text=text[:200]
        )
        return
    chunks = _split_text(text, 3000)
    for chunk in chunks:
        chunk_blocks = _text_to_blocks(chunk)
        client.chat_postMessage(
            channel=channel, thread_ts=thread_ts, blocks=chunk_blocks, text=chunk[:200]
        )


def _fetch_thread_context(client, channel, thread_ts, limit=MAX_THREAD_CONTEXT):
    try:
        result = client.conversations_replies(channel=channel, ts=thread_ts, limit=limit + 5)
        messages = result.get("messages", [])
        context_lines = []
        for msg in messages[:-1]:
            user = msg.get("user", "bot")
            text = msg.get("text", "").strip()
            if text and user != bot_user_id:
                context_lines.append(f"User <@{user}>: {text}")
            elif text and user == bot_user_id:
                context_lines.append(f"Bot: {text}")
        if not context_lines:
            return ""
        return "## Previous conversation in this thread:\n" + "\n".join(context_lines[-limit:]) + "\n\n"
    except Exception:
        return ""


def _format_response(text):
    if not text:
        return "I wasn't able to generate a response. Please try again."
    text = text.strip()
    if text.startswith("Error:"):
        return "Sorry, I ran into an issue processing that. Please try again or rephrase your request."
    return text


def _handle_quick_command(client, channel, thread_ts, user_id, text):
    lower = text.lower().strip()

    m = re.match(r"start working on ([A-Z]+-\d+)", text, re.IGNORECASE)
    if m:
        ticket_id = m.group(1).upper()
        try:
            linear_api.transition_issue(ticket_id, "In Progress")
            _post_reply(client, channel, thread_ts, f"Started *{ticket_id}* and moved to In Progress.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to start {ticket_id}: {e}")
        return True

    m = re.match(r"assign ([A-Z]+-\d+) to me", text, re.IGNORECASE)
    if m:
        ticket_id = m.group(1).upper()
        try:
            info = client.users_info(user=user_id)
            email = info["user"]["profile"].get("email", "")
            result = linear_api.assign_issue(ticket_id, email)
            _post_reply(client, channel, thread_ts, f"Assigned *{ticket_id}* to you.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to assign {ticket_id}: {e}")
        return True

    m = re.match(r"move ([A-Z]+-\d+) to (.+)", text, re.IGNORECASE)
    if m:
        ticket_id = m.group(1).upper()
        state = m.group(2).strip()
        try:
            linear_api.transition_issue(ticket_id, state)
            _post_reply(client, channel, thread_ts, f"Moved *{ticket_id}* to {state}.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to move {ticket_id}: {e}")
        return True

    if lower == "list my tickets":
        try:
            info = client.users_info(user=user_id)
            email = info["user"]["profile"].get("email", "")
            issues = linear_api.list_my_issues(email)
            if not issues:
                _post_reply(client, channel, thread_ts, "No tickets assigned to you.")
            else:
                lines = [f"*{i['identifier']}* [{i['state']['name']}] {i['title']}" for i in issues]
                _post_reply(client, channel, thread_ts, "\n".join(lines))
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to list tickets: {e}")
        return True

    m = re.match(r"(?:what'?s|status)\s+([A-Z]+-\d+)", text, re.IGNORECASE)
    if m:
        ticket_id = m.group(1).upper()
        try:
            issue = linear_api.get_issue(ticket_id)
            assignee = issue.get("assignee", {})
            assignee_name = assignee.get("name", "Unassigned") if assignee else "Unassigned"
            state = issue.get("state", {}).get("name", "Unknown")
            _post_reply(
                client, channel, thread_ts,
                f"*{issue['identifier']}*: {issue['title']}\nStatus: {state} | Assignee: {assignee_name}\n{issue.get('url', '')}",
            )
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to get {ticket_id}: {e}")
        return True

    m = re.match(r"create ticket[:\s]+(.+)", text, re.IGNORECASE)
    if m:
        title = m.group(1).strip()
        try:
            issue = linear_api.create_issue(title, f"Created from Slack by <@{user_id}>")
            _post_reply(client, channel, thread_ts, f"Created *{issue['identifier']}*: {issue['title']}\n{issue.get('url', '')}")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to create ticket: {e}")
        return True

    if lower == "schedule list":
        try:
            tasks = list_tasks("pending")
            if not tasks:
                _post_reply(client, channel, thread_ts, "No pending tasks.")
            else:
                lines = [f"#{t['id']} [{t['status']}] {t['user_text'][:80]}" for t in tasks]
                _post_reply(client, channel, thread_ts, "\n".join(lines))
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to list tasks: {e}")
        return True

    if lower == "run email":
        try:
            import subprocess
            import sys
            subprocess.Popen(
                [sys.executable, "-m", "agents.bots.email_agent", "--model", DEFAULT_MODEL],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            )
            _post_reply(client, channel, thread_ts, "Email agent triggered.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to run email agent: {e}")
        return True

    if lower in ("briefing", "morning briefing", "daily briefing"):
        try:
            import subprocess as _sp
            result = _sp.run(
                [sys.executable, "-m", "agents.bots.briefing_agent", "--print-only"],
                capture_output=True, text=True, timeout=120,
            )
            if result.returncode == 0 and result.stdout.strip():
                _post_reply(client, channel, thread_ts, result.stdout.strip())
            else:
                _post_reply(client, channel, thread_ts, "Failed to generate briefing.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Briefing failed: {e}")
        return True

    if lower in ("what should i work on", "what next", "priorities", "what should i work on next"):
        try:
            import subprocess as _sp
            result = _sp.run(
                [sys.executable, "-m", "agents.tools.prioritizer", "summary"],
                capture_output=True, text=True, timeout=60,
            )
            if result.returncode == 0 and result.stdout.strip():
                _post_reply(client, channel, thread_ts, result.stdout.strip())
            else:
                _post_reply(client, channel, thread_ts, "Couldn't determine priorities right now.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Prioritizer failed: {e}")
        return True

    if lower in ("sentry status", "errors", "sentry"):
        try:
            import subprocess as _sp
            result = _sp.run(
                [sys.executable, "-m", "agents.tools.sentry_api", "stats"],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                lines = [f":rotating_light: *Sentry Status*\nUnresolved: {data.get('unresolved_count', '?')}"]
                for issue in data.get("top_issues", [])[:5]:
                    lines.append(f"  - [{issue.get('level', '?')}] {issue['title']} ({issue.get('count', '?')}x)")
                _post_reply(client, channel, thread_ts, "\n".join(lines))
            else:
                _post_reply(client, channel, thread_ts, "Couldn't fetch Sentry status.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Sentry check failed: {e}")
        return True

    if lower in ("deploy status", "vercel", "deployment"):
        try:
            import subprocess as _sp
            result = _sp.run(
                [sys.executable, "-m", "agents.tools.vercel_api", "latest"],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode == 0 and result.stdout.strip():
                data = json.loads(result.stdout)
                state = data.get("state", "UNKNOWN")
                icon = ":white_check_mark:" if state == "READY" else ":x:"
                text = f"{icon} *Latest Deploy:* {state}\nBranch: {data.get('branch', '?')}\n{data.get('source', '')}"
                if data.get("url"):
                    text += f"\n<https://{data['url']}|View>"
                _post_reply(client, channel, thread_ts, text)
            else:
                _post_reply(client, channel, thread_ts, "Couldn't fetch deploy status.")
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Deploy check failed: {e}")
        return True

    if lower in ("help", "commands", "what can you do"):
        help_text = (
            "*Available Commands:*\n"
            "• `start working on [TICKET-ID]` - Move ticket to In Progress\n"
            "• `assign [TICKET-ID] to me` - Assign ticket to yourself\n"
            "• `move [TICKET-ID] to [STATE]` - Change ticket state\n"
            "• `list my tickets` - Show your assigned tickets\n"
            "• `status [TICKET-ID]` - Get ticket details\n"
            "• `create ticket: [title]` - Create a new ticket\n"
            "• `schedule list` - Show pending tasks\n"
            "• `run email` - Trigger email agent\n"
            "• `briefing` - Get daily briefing\n"
            "• `what next` - Get prioritized task recommendations\n"
            "• `sentry status` - Show Sentry error summary\n"
            "• `deploy status` - Show latest Vercel deployment\n"
            "• `help` - Show this message\n\n"
            "_For anything else, just ask me and I'll figure it out!_"
        )
        _post_reply(client, channel, thread_ts, help_text)
        return True

    return False


def _is_bot_in_thread(client, channel, thread_ts):
    if (channel, thread_ts) in _active_threads:
        return True
    try:
        result = client.conversations_replies(channel=channel, ts=thread_ts, limit=50)
        for msg in result.get("messages", []):
            if msg.get("user") == bot_user_id:
                _active_threads.add((channel, thread_ts))
                return True
    except Exception:
        pass
    return False


_MAX_ACTIVE_THREADS = 1000


def _track_thread(channel, thread_ts):
    if len(_active_threads) >= _MAX_ACTIVE_THREADS:
        # Evict oldest entries when cap is reached
        try:
            _active_threads.discard(next(iter(_active_threads)))
        except StopIteration:
            pass
    _active_threads.add((channel, thread_ts))


@app.event("app_mention")
def handle_mention(event, client):
    text = re.sub(r"<@[A-Z0-9]+>", "", event.get("text", "")).strip()
    channel = event["channel"]
    ts = event["ts"]
    thread_ts = event.get("thread_ts", ts)
    user_id = event.get("user", "")

    _track_thread(channel, thread_ts)

    if _handle_quick_command(client, channel, thread_ts, user_id, text):
        return

    enqueue(
        channel=channel,
        thread_ts=thread_ts,
        message_ts=ts,
        user_id=user_id,
        text=text,
    )


@app.event("message")
def handle_message(event, client):
    if event.get("user") == bot_user_id or event.get("bot_id"):
        return
    if event.get("subtype"):
        return

    text = event.get("text", "").strip()
    if not text:
        return

    channel = event["channel"]
    ts = event["ts"]
    thread_ts = event.get("thread_ts")
    user_id = event.get("user", "")
    is_dm = event.get("channel_type") == "im"
    is_thread_reply = thread_ts is not None and thread_ts != ts

    if is_dm:
        if _handle_quick_command(client, channel, thread_ts or ts, user_id, text):
            return
        enqueue(
            channel=channel,
            thread_ts=thread_ts or ts,
            message_ts=ts,
            user_id=user_id,
            text=text,
        )
        return

    if is_thread_reply and _is_bot_in_thread(client, channel, thread_ts):
        text = re.sub(r"<@[A-Z0-9]+>", "", text).strip()
        if not text:
            return

        if _handle_quick_command(client, channel, thread_ts, user_id, text):
            return

        enqueue(
            channel=channel,
            thread_ts=thread_ts,
            message_ts=ts,
            user_id=user_id,
            text=text,
        )


def run_worker(slack_client, model):
    logger.info("Worker started")
    recover_stale()

    maintenance_counter = 0

    while True:
        task = claim_next()
        if not task:
            time.sleep(2)
            maintenance_counter += 1
            if maintenance_counter >= 30:
                timeout_stale(15)
                purge_old(7)
                maintenance_counter = 0
            continue

        task_id = task["id"]
        channel = task["slack_channel"]
        thread_ts = task["slack_thread_ts"]
        prompt = task["user_text"]

        logger.info("Processing task %d: %s", task_id, prompt[:100])

        thinking_msg = None
        try:
            thinking_msg = slack_client.chat_postMessage(
                channel=channel, thread_ts=thread_ts, text=":hourglass: Working on it..."
            )
        except Exception:
            pass

        try:
            thread_context = _fetch_thread_context(slack_client, channel, thread_ts)
            full_prompt = thread_context + "## Current request:\n" + prompt
            result = run_master(full_prompt, model)
            response = _format_response(result)

            if thinking_msg:
                try:
                    slack_client.chat_update(
                        channel=channel, ts=thinking_msg["ts"], text=response
                    )
                except Exception:
                    _post_reply(slack_client, channel, thread_ts, response)
            else:
                _post_reply(slack_client, channel, thread_ts, response)

            complete(task_id, result[:500])
            _track_thread(channel, thread_ts)

            try:
                slack_client.reactions_add(channel=channel, name="white_check_mark", timestamp=task["slack_message_ts"])
            except Exception:
                pass

        except Exception as e:
            logger.exception("Task %d failed", task_id)
            error_msg = "Sorry, I hit an issue processing that. Please try again."
            if thinking_msg:
                try:
                    slack_client.chat_update(channel=channel, ts=thinking_msg["ts"], text=error_msg)
                except Exception:
                    pass
            try:
                slack_client.chat_postMessage(channel=channel, thread_ts=thread_ts, text=error_msg)
            except Exception:
                pass
            fail(task_id, str(e))


def main():
    global bot_user_id

    parser = argparse.ArgumentParser(description="Consilium Slack Bot")
    parser.add_argument("--model", default=DEFAULT_MODEL)
    args = parser.parse_args()

    auth = app.client.auth_test()
    bot_user_id = auth["user_id"]
    logger.info("Bot user ID: %s", bot_user_id)

    worker = threading.Thread(target=run_worker, args=(app.client, args.model), daemon=True)
    worker.start()

    handler = SocketModeHandler(app, SLACK_APP_TOKEN)
    handler.start()


if __name__ == "__main__":
    main()

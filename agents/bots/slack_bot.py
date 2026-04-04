import argparse
import json
import re
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
from agents.tools.memory_tool import check, track

logger = setup_logging("slack_bot")

app = App(token=SLACK_BOT_TOKEN)

bot_user_id = None
task_queue = []

MASTER_RULES = """
## Slack Master Agent Rules

1. You receive messages from Slack users. Understand what they need.
2. Read the **CONVERSATION HISTORY** carefully - it contains prior messages from this thread.
3. Be decisive and action-oriented. Don't ask for permissions repeatedly - just proceed with available tools.
4. If a user says "approved", "done", "yes", or similar - that means proceed with the task you proposed.
5. Remember what was discussed earlier in the thread. Don't say "I don't have context" if history is provided.
6. Execute tasks end-to-end. Create tickets, assign them, update status - all in one go when requested.
7. Use available tools immediately. If Linear tools are available, use them without asking for permission.
8. Keep responses concise. Don't list what tools you have - just use them.
9. If you hit an error, explain briefly and try an alternative approach.
10. Always respond in the context of the Consilium product.
"""


def _build_system_prompt():
    return build_base_prompt(
        role_description="You are Consilium's Slack assistant. You help the team with support queries, ticket management, and product questions.",
        agent_rules=MASTER_RULES,
    )


def _fetch_thread_history(client, channel, thread_ts, limit=20):
    """Fetch previous messages in a thread for context."""
    try:
        result = client.conversations_replies(
            channel=channel,
            ts=thread_ts,
            limit=limit,
        )
        messages = result.get("messages", [])
        history = []
        for msg in messages[:-1]:  # Exclude the current message
            user = msg.get("user", "bot")
            text = msg.get("text", "")
            # Clean up bot mentions
            text = re.sub(r"<@[A-Z0-9]+>", "", text).strip()
            if text:
                role = "assistant" if msg.get("bot_id") else "user"
                history.append(f"[{role}]: {text}")
        return history
    except Exception as e:
        logger.warning("Failed to fetch thread history: %s", e)
        return []


def _get_conversation_context(thread_ts):
    """Check memory for previous context about this conversation."""
    try:
        result = check("conversation", thread_ts)
        if result.get("processed") and result.get("entry"):
            return result["entry"].get("summary", "")
    except Exception:
        pass
    return ""


def _save_conversation_context(thread_ts, summary):
    """Save conversation context to memory."""
    try:
        track("conversation", thread_ts, "active", summary)
    except Exception as e:
        logger.warning("Failed to save conversation context: %s", e)


def run_master(prompt, model="sonnet", thread_history=None, conversation_context=None):
    system_prompt = _build_system_prompt()
    subagents = get_subagents("plan", "verify-response")

    # Build enhanced prompt with context
    enhanced_prompt = ""

    if thread_history:
        enhanced_prompt += "## CONVERSATION HISTORY (read this for context)\n"
        enhanced_prompt += "\n".join(thread_history)
        enhanced_prompt += "\n\n"

    if conversation_context:
        enhanced_prompt += f"## PREVIOUS CONTEXT\n{conversation_context}\n\n"

    enhanced_prompt += f"## CURRENT MESSAGE\n{prompt}"

    return run_claude(enhanced_prompt, system_prompt=system_prompt, model=model, subagents=subagents)


def _post_reply(client, channel, thread_ts, text):
    if len(text) <= 4000:
        client.chat_postMessage(channel=channel, thread_ts=thread_ts, text=text)
        return
    chunks = [text[i:i + 4000] for i in range(0, len(text), 4000)]
    for chunk in chunks:
        client.chat_postMessage(channel=channel, thread_ts=thread_ts, text=chunk)


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

    # Create ticket and start working on it in one command
    m = re.match(r"create ticket and (?:start|work)[:\s]+(.+)", text, re.IGNORECASE)
    if m:
        title = m.group(1).strip()
        try:
            info = client.users_info(user=user_id)
            email = info["user"]["profile"].get("email", "")
            issue = linear_api.create_issue(title, f"Created from Slack by <@{user_id}>")
            ticket_id = issue["identifier"]
            linear_api.assign_issue(ticket_id, email)
            linear_api.transition_issue(ticket_id, "In Progress")
            _post_reply(
                client, channel, thread_ts,
                f"Created *{ticket_id}*: {issue['title']}\nAssigned to you and moved to In Progress.\n{issue.get('url', '')}",
            )
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to create and start ticket: {e}")
        return True

    return False


@app.event("app_mention")
def handle_mention(event, client):
    text = re.sub(r"<@[A-Z0-9]+>", "", event.get("text", "")).strip()
    channel = event["channel"]
    ts = event["ts"]
    thread_ts = event.get("thread_ts", ts)
    user_id = event.get("user", "")

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
def handle_dm(event, client):
    if event.get("channel_type") != "im":
        return
    if event.get("user") == bot_user_id or event.get("bot_id"):
        return

    text = event.get("text", "").strip()
    channel = event["channel"]
    ts = event["ts"]
    thread_ts = event.get("thread_ts", ts)
    user_id = event.get("user", "")

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

        try:
            slack_client.reactions_add(channel=channel, name="hourglass_flowing_sand", timestamp=task["slack_message_ts"])
        except Exception:
            pass

        # Fetch thread history for context
        thread_history = _fetch_thread_history(slack_client, channel, thread_ts)
        conversation_context = _get_conversation_context(thread_ts)

        try:
            result = run_master(prompt, model, thread_history=thread_history, conversation_context=conversation_context)
            _post_reply(slack_client, channel, thread_ts, result)
            complete(task_id, result[:500])

            # Save conversation context for future reference
            _save_conversation_context(thread_ts, f"Last topic: {prompt[:100]}")

            try:
                slack_client.reactions_add(channel=channel, name="white_check_mark", timestamp=task["slack_message_ts"])
            except Exception:
                pass

        except Exception as e:
            logger.exception("Task %d failed", task_id)
            try:
                slack_client.chat_postMessage(
                    channel=channel, thread_ts=thread_ts,
                    text=f"Sorry, I hit an error processing that: {e}",
                )
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

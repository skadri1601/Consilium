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
4. If a user says "approved", "done", "yes", "sure", or similar - that means proceed with the task you proposed.
5. Remember what was discussed earlier in the thread. Never say "I don't have context" when history is provided.
6. Execute tasks end-to-end. Create tickets, assign them, update status - all in one go when requested.
7. Use available tools immediately. Don't ask for permission - just use them.
8. Keep responses concise. Don't list what tools you have - just use them.
9. If you hit an error, explain briefly and try an alternative approach.
10. Always respond in the context of the Consilium product.
11. The **USER INFO** section tells you who is talking. Use their email for assignments and lookups.
12. When asked to create a ticket AND work on it, do both in a single response - create, assign, transition to In Progress.
13. Acknowledge confirmations ("done", "approved") by immediately doing the previously proposed action.
"""

MAX_HISTORY_CHARS = 6000  # Cap thread history to avoid blowing up the prompt

GREETING_PATTERNS = re.compile(
    r"^(hi|hello|hey|yo|sup|what'?s up|howdy|greetings?)\s*[!?.]*$",
    re.IGNORECASE,
)

GREETING_RESPONSE = "Hey! How can I help you today?"


def _build_system_prompt():
    return build_base_prompt(
        role_description="You are Consilium's Slack assistant. You help the team with support queries, ticket management, and product questions.",
        agent_rules=MASTER_RULES,
    )


def _fetch_thread_history(client, channel, thread_ts, limit=20):
    """Fetch previous messages in a thread for context, capped by MAX_HISTORY_CHARS."""
    try:
        result = client.conversations_replies(
            channel=channel,
            ts=thread_ts,
            limit=limit,
        )
        messages = result.get("messages", [])
        history = []
        total_chars = 0
        # Walk messages oldest-first, exclude the current (last) message
        for msg in messages[:-1]:
            text = msg.get("text", "")
            # Clean up bot mentions
            text = re.sub(r"<@[A-Z0-9]+>", "", text).strip()
            if not text:
                continue
            role = "assistant" if msg.get("bot_id") else "user"
            line = f"[{role}]: {text}"
            total_chars += len(line)
            if total_chars > MAX_HISTORY_CHARS:
                # Keep the most recent messages that fit
                break
            history.append(line)
        return history
    except Exception as e:
        logger.warning("Failed to fetch thread history: %s", e)
        return []


def _resolve_user_info(client, user_id):
    """Look up Slack user profile for identity context."""
    try:
        info = client.users_info(user=user_id)
        profile = info["user"]["profile"]
        name = profile.get("real_name") or profile.get("display_name") or "Unknown"
        email = profile.get("email", "")
        return {"name": name, "email": email, "user_id": user_id}
    except Exception as e:
        logger.warning("Failed to resolve user info for %s: %s", user_id, e)
        return {"name": "Unknown", "email": "", "user_id": user_id}


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


def run_master(prompt, model="sonnet", thread_history=None, conversation_context=None, user_info=None):
    system_prompt = _build_system_prompt()
    subagents = get_subagents("plan", "verify-response")

    # Build enhanced prompt with context
    parts = []

    if user_info:
        parts.append(
            f"## USER INFO\nName: {user_info['name']}\n"
            f"Email: {user_info['email']}\nSlack ID: {user_info['user_id']}"
        )

    if thread_history:
        parts.append(
            "## CONVERSATION HISTORY (read this for context)\n"
            + "\n".join(thread_history)
        )

    if conversation_context:
        parts.append(f"## PREVIOUS CONTEXT\n{conversation_context}")

    parts.append(f"## CURRENT MESSAGE\n{prompt}")

    enhanced_prompt = "\n\n".join(parts)
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

    # Fast greeting response - skip the LLM entirely
    if GREETING_PATTERNS.match(lower):
        _post_reply(client, channel, thread_ts, GREETING_RESPONSE)
        return True

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

    m = re.match(r"create (?:a )?ticket[:\s]+(?:about |for |on )?(.+)", text, re.IGNORECASE)
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
    m = re.match(r"create (?:a )?ticket (?:and )?(?:start|work)(?: on)?[:\s]+(.+)", text, re.IGNORECASE)
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

        # Gather context for the master agent
        thread_history = _fetch_thread_history(slack_client, channel, thread_ts)
        conversation_context = _get_conversation_context(thread_ts)
        user_info = _resolve_user_info(slack_client, task.get("user_id", ""))

        try:
            result = run_master(
                prompt, model,
                thread_history=thread_history,
                conversation_context=conversation_context,
                user_info=user_info,
            )
            _post_reply(slack_client, channel, thread_ts, result)
            complete(task_id, result[:500])

            # Save conversation context including what action was taken
            summary = f"User: {user_info['name']} | Topic: {prompt[:80]} | Result: {result[:120]}"
            _save_conversation_context(thread_ts, summary)

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

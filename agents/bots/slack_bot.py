import argparse
import json
import re
import sys
import threading
import time

from slack_bolt import App
from slack_bolt.adapter.socket_mode import SocketModeHandler

from agents.config import DEFAULT_MODEL, SLACK_APP_TOKEN, SLACK_BOT_TOKEN
from agents.core.base import run_claude, setup_logging, AGENTS_DIR
<<<<<<< Updated upstream
from agents.core.router import route, detect_intent
from agents.core import session as sess
=======
>>>>>>> Stashed changes
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

MAX_THREAD_CONTEXT = 10

app = App(token=SLACK_BOT_TOKEN)

bot_user_id = None
task_queue = []
_active_threads = set()
_conversation_contexts = {}

GREETING_PATTERNS = re.compile(
    r"^(hi|hello|hey|yo|sup|what'?s up|howdy|good (morning|afternoon|evening))[\s!.?]*$"
)
GREETING_RESPONSE = "Hey! How can I help you today? Type `help` to see what I can do."

def _fetch_thread_history(client, channel, thread_ts, limit=MAX_THREAD_CONTEXT):
    try:
        result = client.conversations_replies(channel=channel, ts=thread_ts, limit=limit)
        return result.get("messages", [])
    except Exception:
        return []


def _get_conversation_context(thread_ts):
    return _conversation_contexts.get(thread_ts, "")


def _save_conversation_context(thread_ts, summary):
    existing = _conversation_contexts.get(thread_ts, "")
    _conversation_contexts[thread_ts] = (existing + "\n" + summary).strip()[-2000:]


def _resolve_user_info(client, user_id):
    if not user_id:
        return {"name": "Unknown", "email": ""}
    try:
        info = client.users_info(user=user_id)
        profile = info["user"]["profile"]
        return {
            "name": profile.get("real_name", profile.get("display_name", "Unknown")),
            "email": profile.get("email", ""),
        }
    except Exception:
        return {"name": user_id, "email": ""}


def _build_system_prompt():
    prompt_path = AGENTS_DIR / "guides" / "consilium_bot_prompt.md"
    if prompt_path.exists():
        return prompt_path.read_text(encoding="utf-8")
    return "You are Consilium Bot. Take action immediately when asked. Use all available tools."


def run_master(prompt, model="haiku"):
    system_prompt = _build_system_prompt()
    return run_claude(prompt, system_prompt=system_prompt, model=model)


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
        for msg in messages:
            user = msg.get("user", "bot")
            text = msg.get("text", "").strip()
            if not text:
                continue
            if user == bot_user_id or msg.get("bot_id"):
                context_lines.append(f"Consilium_Bot: {text[:500]}")
            else:
                context_lines.append(f"User: {text}")
        if not context_lines:
            return ""
        return "## Full thread conversation so far:\n" + "\n".join(context_lines[-limit:]) + "\n\n## IMPORTANT: Use the conversation above to understand what the user is referring to. Do NOT ask for clarification if the answer is obvious from context.\n\n"
    except Exception as e:
        logger.warning("Failed to fetch thread context: %s", e)
        return ""


def _format_response(text):
    if not text:
        return "I processed your request but didn't get a response. Please try again."
    text = text.strip()
    if text.startswith("Error:"):
        return "Sorry, I ran into an issue. Please try again."
    return text


def _handle_quick_command(client, channel, thread_ts, user_id, text, thread_session=None):
    if thread_session is None:
        thread_session = sess.load(thread_ts)

<<<<<<< Updated upstream
    response, intent, handled = route(text, thread_session)

    if handled and response:
        _post_reply(client, channel, thread_ts, response)
        sess.add_exchange(thread_session, text, response, intent)
        sess.save(thread_ts, thread_session)
=======
    if lower in ("hi", "hello", "hey", "sup", "yo"):
        _post_reply(client, channel, thread_ts, "Hey! What can I help you with?")
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

    # Create ticket and start working on it (full flow)
    m = re.match(r"create (?:an? )?ticket (?:and|&) start[:\s]*(.+)", text, re.IGNORECASE)
    if m:
        title = m.group(1).strip()
        try:
            info = client.users_info(user=user_id)
            email = info["user"]["profile"].get("email", "")
            issue = linear_api.create_issue(title, f"Created from Slack by <@{user_id}>")
            linear_api.assign_issue(issue["identifier"], email)
            linear_api.transition_issue(issue["identifier"], "In Progress")
            _post_reply(
                client, channel, thread_ts,
                f"Created *{issue['identifier']}*: {issue['title']}\nAssigned to you and moved to In Progress.\n{issue.get('url', '')}",
            )
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to create and start ticket: {e}")
        return True

    # Natural language: "create a ticket about X" or "create ticket on linear about X"
    m = re.match(
        r"create (?:an? )?(?:ticket|issue) (?:on linear )?(?:about|for|regarding)[:\s]+(?:the (?:issue )?)?(.+?)(?:\s+and\s+(?:after that |then )?(?:start|assign|tag|work|move|tell).*)?$",
        text, re.IGNORECASE
    )
    if m:
        # Extract the core issue title, cleaning up common phrases
        title = m.group(1).strip()
        title = re.sub(r"\s+and\s+after that.*$", "", title, flags=re.IGNORECASE).strip()

        # Check if user wants to start working on it or assign to someone
        wants_start = bool(re.search(r"(?:start|work|move.*(?:in\s*progress|started))", text, re.IGNORECASE))
        wants_assign_claude = bool(re.search(r"(?:tag|assign)\s+(?:claude|bot|it)", text, re.IGNORECASE))
        wants_assign_me = bool(re.search(r"assign\s+(?:to\s+)?me", text, re.IGNORECASE))

        try:
            issue = linear_api.create_issue(title.title(), f"Created from Slack by <@{user_id}>")
            msg = f"Created *{issue['identifier']}*: {issue['title']}"

            # Handle assignment
            if wants_assign_me or wants_assign_claude:
                info = client.users_info(user=user_id)
                email = info["user"]["profile"].get("email", "")
                linear_api.assign_issue(issue["identifier"], email)
                msg += f"\nAssigned to <@{user_id}>."

            # Handle status transition
            if wants_start:
                linear_api.transition_issue(issue["identifier"], "In Progress")
                msg += "\nMoved to In Progress."

            msg += f"\n{issue.get('url', '')}"
            _post_reply(client, channel, thread_ts, msg)
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to create ticket: {e}")
        return True

    # Fallback for complex Linear requests - extract ticket creation intent
    if re.search(r"create\s+(?:an?\s+)?(?:ticket|issue)", text, re.IGNORECASE) and re.search(r"linear|email|not working|bug|fix", text, re.IGNORECASE):
        # Try to extract a reasonable title from the request
        title_match = re.search(
            r"(?:about|regarding|for|issue[:\s]+)\s*(?:the\s+(?:issue\s+)?)?([^,]+?)(?:\s+and\s+|$|\s+tag\s+|\s+then\s+)",
            text, re.IGNORECASE
        )
        if title_match:
            title = title_match.group(1).strip()
        else:
            # Last resort: grab key phrases
            title = re.sub(r"<@[A-Z0-9]+>", "", text)
            title = re.sub(r"create\s+(?:an?\s+)?(?:ticket|issue)\s+(?:on\s+linear\s+)?", "", title, flags=re.IGNORECASE)
            title = re.sub(r"\s+and\s+(?:after|then|tag|assign|start|work|move).*$", "", title, flags=re.IGNORECASE)
            title = re.sub(r"(?:about|regarding|for)\s+(?:the\s+(?:issue\s+)?)?", "", title, flags=re.IGNORECASE).strip()
            title = title[:100] if title else "Issue from Slack"

        wants_start = bool(re.search(r"(?:start|work|move.*progress)", text, re.IGNORECASE))

        try:
            issue = linear_api.create_issue(title.strip().title(), f"Created from Slack by <@{user_id}>")
            msg = f"Created *{issue['identifier']}*: {issue['title']}"

            info = client.users_info(user=user_id)
            email = info["user"]["profile"].get("email", "")
            linear_api.assign_issue(issue["identifier"], email)
            msg += f"\nAssigned to <@{user_id}>."

            if wants_start:
                linear_api.transition_issue(issue["identifier"], "In Progress")
                msg += "\nMoved to In Progress."

            msg += f"\n{issue.get('url', '')}"
            _post_reply(client, channel, thread_ts, msg)
        except Exception as e:
            _post_reply(client, channel, thread_ts, f"Failed to create ticket: {e}")
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
>>>>>>> Stashed changes
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

    thread_session = sess.load(thread_ts)

    if _handle_quick_command(client, channel, thread_ts, user_id, text, thread_session):
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
        dm_session = sess.load(thread_ts or ts)
        if _handle_quick_command(client, channel, thread_ts or ts, user_id, text, dm_session):
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

        thread_session = sess.load(thread_ts)
        if _handle_quick_command(client, channel, thread_ts, user_id, text, thread_session):
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

        # Gather context for the master agent
        thread_history = _fetch_thread_history(slack_client, channel, thread_ts)
        conversation_context = _get_conversation_context(thread_ts)
        user_info = _resolve_user_info(slack_client, task.get("user_id", ""))

        try:
            thread_session = sess.load(thread_ts)
            thread_context = _fetch_thread_context(slack_client, channel, thread_ts)
<<<<<<< Updated upstream

            session_context = sess.get_context_summary(thread_session)
            if session_context:
                context_block = "## Session history (what was discussed):\n" + session_context + "\n\n"
            else:
                context_block = ""

            if thread_context and len(prompt.split()) <= 5:
                full_prompt = thread_context + context_block + "## Current request:\n" + prompt + "\n\n## IMPORTANT: The user's message is short. This is a FOLLOW-UP to the conversation above. Look at the last exchange and continue from there."
            else:
                full_prompt = thread_context + context_block + "## Current request:\n" + prompt

=======
            if thread_context and len(prompt.split()) <= 5:
                full_prompt = thread_context + "## Current request:\n" + prompt + "\n\n## IMPORTANT: The user's message is short (e.g. 'yes', 'do it', 'show me'). This is a FOLLOW-UP to the conversation above. Look at your LAST response in the thread and continue from there. Do NOT ask what they need help with."
            else:
                full_prompt = thread_context + "## Current request:\n" + prompt
>>>>>>> Stashed changes
            result = run_master(full_prompt, model)
            response = _format_response(result)

            if thinking_msg:
                try:
                    if len(response) <= 3000:
                        slack_client.chat_update(
                            channel=channel, ts=thinking_msg["ts"], text=response
                        )
                    else:
                        slack_client.chat_delete(channel=channel, ts=thinking_msg["ts"])
                        _post_reply(slack_client, channel, thread_ts, response)
                except Exception:
                    _post_reply(slack_client, channel, thread_ts, response)
            else:
                _post_reply(slack_client, channel, thread_ts, response)

            complete(task_id, result[:500])
            _track_thread(channel, thread_ts)

            sess.add_exchange(thread_session, prompt, response)
            sess.save(thread_ts, thread_session)

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

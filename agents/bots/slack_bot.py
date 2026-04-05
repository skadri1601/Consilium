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
from agents.core.router import route
from agents.core import session as sess
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

    thread_session = sess.load(thread_ts) if thread_ts else {}

    response, intent, handled = route(text, thread_session)

    if handled and response:
        _post_reply(client, channel, thread_ts, response)
        sess.add_exchange(thread_session, text, response, intent)
        if thread_ts:
            sess.save(thread_ts, thread_session)
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

        try:
            thread_session = sess.load(thread_ts)
            thread_context = _fetch_thread_context(slack_client, channel, thread_ts)
            session_context = sess.get_context_summary(thread_session)
            context_block = ""
            if session_context:
                context_block = "## Session history:\n" + session_context + "\n\n"

            if thread_context and len(prompt.split()) <= 5:
                full_prompt = thread_context + context_block + "## Current request:\n" + prompt + "\n\n## IMPORTANT: Short follow-up. Continue from last exchange."
            else:
                full_prompt = thread_context + context_block + "## Current request:\n" + prompt
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

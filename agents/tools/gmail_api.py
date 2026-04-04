"""Gmail API tool for reading, sending, and managing emails.

Usage:
  python -m agents.tools.gmail_api list-unreplied --email support@example.com [--limit 10]
  python -m agents.tools.gmail_api get-message --email support@example.com --message-id MSG_ID
  python -m agents.tools.gmail_api send --email support@example.com --to user@example.com --subject "Re: ..." --body "..."
  python -m agents.tools.gmail_api reply --email support@example.com --message-id MSG_ID --body "..."
  python -m agents.tools.gmail_api mark-read --email support@example.com --message-id MSG_ID
  python -m agents.tools.gmail_api archive --email support@example.com --message-id MSG_ID
  python -m agents.tools.gmail_api star --email support@example.com --message-id MSG_ID
  python -m agents.tools.gmail_api search --email support@example.com --query "from:ayush" [--limit 10]
  python -m agents.tools.gmail_api get-thread --email support@example.com --thread-id THREAD_ID
"""

import argparse
import base64
import json
import sys
from email.mime.text import MIMEText

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

from agents.config import GMAIL_CREDENTIALS_PATH, GMAIL_TOKENS_DIR

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


def _get_service(email: str):
    creds = Credentials.from_service_account_file(
        GMAIL_CREDENTIALS_PATH, scopes=SCOPES
    )
    delegated = creds.with_subject(email)
    return build("gmail", "v1", credentials=delegated, cache_discovery=False)


def list_unreplied_threads(email: str, limit: int = 10) -> list[dict]:
    service = _get_service(email)
    results = (
        service.users()
        .threads()
        .list(userId="me", q="is:inbox -is:draft", maxResults=limit)
        .execute()
    )
    threads = results.get("threads", [])
    unreplied = []
    for t in threads:
        thread = (
            service.users()
            .threads()
            .get(userId="me", id=t["id"], format="metadata")
            .execute()
        )
        messages = thread.get("messages", [])
        if not messages:
            continue
        last_msg = messages[-1]
        headers = {
            h["name"].lower(): h["value"]
            for h in last_msg.get("payload", {}).get("headers", [])
        }
        from_addr = headers.get("from", "")
        if email.lower() not in from_addr.lower():
            unreplied.append(
                {
                    "thread_id": t["id"],
                    "message_id": last_msg["id"],
                    "subject": headers.get("subject", ""),
                    "from": from_addr,
                    "date": headers.get("date", ""),
                    "snippet": thread.get("snippet", ""),
                }
            )
    return unreplied


def _extract_body(payload: dict) -> str:
    if payload.get("mimeType") == "text/plain" and payload.get("body", {}).get("data"):
        return base64.urlsafe_b64decode(payload["body"]["data"]).decode("utf-8")
    for part in payload.get("parts", []):
        result = _extract_body(part)
        if result:
            return result
    return ""


def get_message(email: str, message_id: str) -> dict:
    service = _get_service(email)
    msg = (
        service.users()
        .messages()
        .get(userId="me", id=message_id, format="full")
        .execute()
    )
    headers = {
        h["name"].lower(): h["value"]
        for h in msg.get("payload", {}).get("headers", [])
    }
    body = _extract_body(msg.get("payload", {}))
    return {
        "id": msg["id"],
        "thread_id": msg["threadId"],
        "from": headers.get("from", ""),
        "to": headers.get("to", ""),
        "subject": headers.get("subject", ""),
        "date": headers.get("date", ""),
        "body": body,
        "labels": msg.get("labelIds", []),
    }


def send_message(
    email: str,
    to: str,
    subject: str,
    body: str,
    reply_to_message_id: str | None = None,
) -> dict:
    service = _get_service(email)
    mime = MIMEText(body)
    mime["to"] = to
    mime["from"] = email
    mime["subject"] = subject

    request_body: dict = {
        "raw": base64.urlsafe_b64encode(mime.as_bytes()).decode("utf-8")
    }

    if reply_to_message_id:
        orig = (
            service.users()
            .messages()
            .get(userId="me", id=reply_to_message_id, format="metadata")
            .execute()
        )
        headers = {
            h["name"].lower(): h["value"]
            for h in orig.get("payload", {}).get("headers", [])
        }
        mime["In-Reply-To"] = headers.get("message-id", "")
        mime["References"] = headers.get("message-id", "")
        request_body["threadId"] = orig["threadId"]
        request_body["raw"] = base64.urlsafe_b64encode(mime.as_bytes()).decode("utf-8")

    result = service.users().messages().send(userId="me", body=request_body).execute()
    return {"id": result["id"], "threadId": result["threadId"], "status": "sent"}


def mark_read(email: str, message_id: str) -> dict:
    service = _get_service(email)
    service.users().messages().modify(
        userId="me", id=message_id, body={"removeLabelIds": ["UNREAD"]}
    ).execute()
    return {"id": message_id, "status": "marked_read"}


def archive_message(email: str, message_id: str) -> dict:
    service = _get_service(email)
    service.users().messages().modify(
        userId="me", id=message_id, body={"removeLabelIds": ["INBOX"]}
    ).execute()
    return {"id": message_id, "status": "archived"}


def star_message(email: str, message_id: str) -> dict:
    service = _get_service(email)
    service.users().messages().modify(
        userId="me", id=message_id, body={"addLabelIds": ["STARRED"]}
    ).execute()
    return {"id": message_id, "status": "starred"}


def search_messages(email: str, query: str, limit: int = 10) -> list[dict]:
    service = _get_service(email)
    results = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=limit)
        .execute()
    )
    messages = results.get("messages", [])
    output = []
    for m in messages:
        msg = (
            service.users()
            .messages()
            .get(userId="me", id=m["id"], format="metadata")
            .execute()
        )
        headers = {
            h["name"].lower(): h["value"]
            for h in msg.get("payload", {}).get("headers", [])
        }
        output.append({
            "id": msg["id"],
            "thread_id": msg["threadId"],
            "from": headers.get("from", ""),
            "to": headers.get("to", ""),
            "subject": headers.get("subject", ""),
            "date": headers.get("date", ""),
            "snippet": msg.get("snippet", ""),
        })
    return output


def get_thread(email: str, thread_id: str) -> list[dict]:
    service = _get_service(email)
    thread = (
        service.users()
        .threads()
        .get(userId="me", id=thread_id, format="full")
        .execute()
    )
    messages = []
    for msg in thread.get("messages", []):
        headers = {
            h["name"].lower(): h["value"]
            for h in msg.get("payload", {}).get("headers", [])
        }
        body = _extract_body(msg.get("payload", {}))
        messages.append({
            "id": msg["id"],
            "from": headers.get("from", ""),
            "to": headers.get("to", ""),
            "subject": headers.get("subject", ""),
            "date": headers.get("date", ""),
            "body": body[:2000],
        })
    return messages


def main():
    parser = argparse.ArgumentParser(description="Gmail API tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list-unreplied")
    p_list.add_argument("--email", required=True)
    p_list.add_argument("--limit", type=int, default=10)

    p_get = sub.add_parser("get-message")
    p_get.add_argument("--email", required=True)
    p_get.add_argument("--message-id", required=True)

    p_send = sub.add_parser("send")
    p_send.add_argument("--email", required=True)
    p_send.add_argument("--to", required=True)
    p_send.add_argument("--subject", required=True)
    p_send.add_argument("--body", required=True)

    p_reply = sub.add_parser("reply")
    p_reply.add_argument("--email", required=True)
    p_reply.add_argument("--message-id", required=True)
    p_reply.add_argument("--body", required=True)

    p_read = sub.add_parser("mark-read")
    p_read.add_argument("--email", required=True)
    p_read.add_argument("--message-id", required=True)

    p_archive = sub.add_parser("archive")
    p_archive.add_argument("--email", required=True)
    p_archive.add_argument("--message-id", required=True)

    p_star = sub.add_parser("star")
    p_star.add_argument("--email", required=True)
    p_star.add_argument("--message-id", required=True)

    p_search = sub.add_parser("search")
    p_search.add_argument("--email", required=True)
    p_search.add_argument("--query", required=True)
    p_search.add_argument("--limit", type=int, default=10)

    p_thread = sub.add_parser("get-thread")
    p_thread.add_argument("--email", required=True)
    p_thread.add_argument("--thread-id", required=True)

    args = parser.parse_args()

    try:
        if args.command == "list-unreplied":
            result = list_unreplied_threads(args.email, args.limit)
        elif args.command == "get-message":
            result = get_message(args.email, args.message_id)
        elif args.command == "send":
            result = send_message(args.email, args.to, args.subject, args.body)
        elif args.command == "reply":
            orig = get_message(args.email, args.message_id)
            result = send_message(
                args.email,
                orig["from"],
                f"Re: {orig['subject']}" if not orig["subject"].startswith("Re:") else orig["subject"],
                args.body,
                reply_to_message_id=args.message_id,
            )
        elif args.command == "mark-read":
            result = mark_read(args.email, args.message_id)
        elif args.command == "archive":
            result = archive_message(args.email, args.message_id)
        elif args.command == "star":
            result = star_message(args.email, args.message_id)
        elif args.command == "search":
            result = search_messages(args.email, args.query, args.limit)
        elif args.command == "get-thread":
            result = get_thread(args.email, args.thread_id)
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()

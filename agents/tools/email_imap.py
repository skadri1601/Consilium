"""Email tool using IMAP/SMTP for reading, searching, and sending emails.

Usage:
  python -m agents.tools.email_imap inbox [--limit 10]
  python -m agents.tools.email_imap search --query "from:ayush" [--limit 10]
  python -m agents.tools.email_imap read --uid UID
  python -m agents.tools.email_imap thread --uid UID
  python -m agents.tools.email_imap send --to user@example.com --subject "Subject" --body "Body text"
  python -m agents.tools.email_imap reply --uid UID --body "Reply text"
  python -m agents.tools.email_imap unread [--limit 10]
"""

import argparse
import email
import email.utils
import imaplib
import json
import smtplib
import sys
from datetime import datetime, timezone
from email.header import decode_header
from email.mime.text import MIMEText

from agents.config import IMAP_HOST, IMAP_USER, IMAP_PASSWORD, SMTP_HOST, SMTP_PORT


def _decode_header_value(value):
    if not value:
        return ""
    decoded_parts = decode_header(value)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            result.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(part)
    return " ".join(result)


def _extract_body(msg):
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            if content_type == "text/plain" and "attachment" not in disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            if content_type == "text/html" and "attachment" not in disposition:
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    return payload.decode(charset, errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
    return ""


def _parse_message(msg_data, uid):
    msg = email.message_from_bytes(msg_data)
    body = _extract_body(msg)
    return {
        "uid": uid,
        "from": _decode_header_value(msg.get("From", "")),
        "to": _decode_header_value(msg.get("To", "")),
        "subject": _decode_header_value(msg.get("Subject", "")),
        "date": msg.get("Date", ""),
        "message_id": msg.get("Message-ID", ""),
        "in_reply_to": msg.get("In-Reply-To", ""),
        "references": msg.get("References", ""),
        "body": body[:3000],
    }


def _sanitize_imap_string(value):
    """Sanitize a value for safe embedding in IMAP search string literals."""
    return str(value).replace("\\", "").replace('"', "")


def _connect():
    if not IMAP_HOST or not IMAP_USER or not IMAP_PASSWORD:
        raise RuntimeError("IMAP not configured (need IMAP_HOST, IMAP_USER, IMAP_PASSWORD)")
    conn = imaplib.IMAP4_SSL(IMAP_HOST, timeout=30)
    conn.login(IMAP_USER, IMAP_PASSWORD)
    return conn


def inbox(limit=10):
    conn = _connect()
    try:
        conn.select("INBOX")
        _, data = conn.search(None, "ALL")
        uids = data[0].split()
        uids = uids[-limit:] if uids else []
        uids.reverse()
        messages = []
        for uid in uids:
            _, msg_data = conn.fetch(uid, "(RFC822)")
            if msg_data and msg_data[0]:
                parsed = _parse_message(msg_data[0][1], uid.decode())
                parsed["body"] = parsed["body"][:200]
                messages.append(parsed)
    finally:
        conn.logout()
    return messages


def unread(limit=10):
    conn = _connect()
    try:
        conn.select("INBOX")
        _, data = conn.search(None, "UNSEEN")
        uids = data[0].split()
        uids = uids[-limit:] if uids else []
        uids.reverse()
        messages = []
        for uid in uids:
            _, msg_data = conn.fetch(uid, "(RFC822)")
            if msg_data and msg_data[0]:
                parsed = _parse_message(msg_data[0][1], uid.decode())
                parsed["body"] = parsed["body"][:200]
                messages.append(parsed)
    finally:
        conn.logout()
    return {"unread_count": len(uids), "messages": messages}


def search_emails(query, limit=10):
    conn = _connect()
    try:
        conn.select("INBOX")
        criteria = []
        parts = query.split()
        for part in parts:
            if part.startswith("from:"):
                criteria.append(f'FROM "{_sanitize_imap_string(part[5:])}"')
            elif part.startswith("to:"):
                criteria.append(f'TO "{_sanitize_imap_string(part[3:])}"')
            elif part.startswith("subject:"):
                criteria.append(f'SUBJECT "{_sanitize_imap_string(part[8:])}"')
            else:
                criteria.append(f'TEXT "{_sanitize_imap_string(part)}"')
        search_str = " ".join(criteria) if criteria else f'TEXT "{_sanitize_imap_string(query)}"'
        _, data = conn.search(None, search_str)
        uids = data[0].split()
        uids = uids[-limit:] if uids else []
        uids.reverse()
        messages = []
        for uid in uids:
            _, msg_data = conn.fetch(uid, "(RFC822)")
            if msg_data and msg_data[0]:
                parsed = _parse_message(msg_data[0][1], uid.decode())
                parsed["body"] = parsed["body"][:300]
                messages.append(parsed)
    finally:
        conn.logout()
    return messages


def read_message(uid):
    conn = _connect()
    try:
        conn.select("INBOX")
        _, msg_data = conn.fetch(str(uid), "(RFC822)")
        if not msg_data or not msg_data[0]:
            return {"error": f"Message {uid} not found"}
        parsed = _parse_message(msg_data[0][1], str(uid))
    finally:
        conn.logout()
    return parsed


def get_thread(uid):
    msg = read_message(uid)
    if "error" in msg:
        return msg
    refs = msg.get("references", "") or msg.get("in_reply_to", "")
    if not refs:
        return [msg]
    ref_ids = refs.split()
    conn = _connect()
    try:
        conn.select("INBOX")
        thread = [msg]
        for ref_id in ref_ids[:20]:
            ref_id = _sanitize_imap_string(ref_id.strip("<>"))
            _, data = conn.search(None, f'HEADER Message-ID "<{ref_id}>"')
            uids = data[0].split()
            for u in uids:
                _, msg_data = conn.fetch(u, "(RFC822)")
                if msg_data and msg_data[0]:
                    parsed = _parse_message(msg_data[0][1], u.decode())
                    thread.append(parsed)
    finally:
        conn.logout()
    seen = set()
    unique = []
    for m in thread:
        mid = m.get("message_id", m["uid"])
        if mid not in seen:
            seen.add(mid)
            unique.append(m)
    unique.sort(key=lambda x: x.get("date", ""))
    return unique


def send_email(to, subject, body, reply_to_uid=None):
    original = None
    if reply_to_uid:
        original = read_message(reply_to_uid)
        if "error" in original:
            return original

    msg = MIMEText(body)
    msg["From"] = IMAP_USER
    msg["To"] = to
    msg["Subject"] = subject

    if original:
        if original.get("message_id"):
            msg["In-Reply-To"] = original["message_id"]
            msg["References"] = original.get("references", "") + " " + original["message_id"]
        if not subject.startswith("Re:"):
            msg["Subject"] = f"Re: {original.get('subject', subject)}"

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
        server.login(IMAP_USER, IMAP_PASSWORD)
        server.send_message(msg)

    return {"status": "sent", "to": to, "subject": msg["Subject"]}


def main():
    parser = argparse.ArgumentParser(description="Email IMAP/SMTP tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_inbox = sub.add_parser("inbox")
    p_inbox.add_argument("--limit", type=int, default=10)

    p_unread = sub.add_parser("unread")
    p_unread.add_argument("--limit", type=int, default=10)

    p_search = sub.add_parser("search")
    p_search.add_argument("--query", required=True)
    p_search.add_argument("--limit", type=int, default=10)

    p_read = sub.add_parser("read")
    p_read.add_argument("--uid", required=True)

    p_thread = sub.add_parser("thread")
    p_thread.add_argument("--uid", required=True)

    p_send = sub.add_parser("send")
    p_send.add_argument("--to", required=True)
    p_send.add_argument("--subject", required=True)
    p_send.add_argument("--body", required=True)

    p_reply = sub.add_parser("reply")
    p_reply.add_argument("--uid", required=True)
    p_reply.add_argument("--body", required=True)

    args = parser.parse_args()

    try:
        if args.command == "inbox":
            result = inbox(args.limit)
        elif args.command == "unread":
            result = unread(args.limit)
        elif args.command == "search":
            result = search_emails(args.query, args.limit)
        elif args.command == "read":
            result = read_message(args.uid)
        elif args.command == "thread":
            result = get_thread(args.uid)
        elif args.command == "send":
            result = send_email(args.to, args.subject, args.body)
        elif args.command == "reply":
            msg = read_message(args.uid)
            if "error" in msg:
                result = msg
            else:
                result = send_email(msg["from"], msg.get("subject", ""), args.body, reply_to_uid=args.uid)
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()

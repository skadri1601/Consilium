"""Send transactional emails via Resend API.

Usage:
  python -m agents.tools.resend_email send --to user@example.com --subject "Subject" --body "<p>HTML body</p>"
  python -m agents.tools.resend_email send --to user@example.com --subject "Subject" --text "Plain text body"
"""

import argparse
import json
import sys

import resend

from agents.config import RESEND_API_KEY


def send_email(
    to: str,
    subject: str,
    html: str | None = None,
    text: str | None = None,
    from_email: str = "support@myconsilium.xyz",
) -> dict:
    resend.api_key = RESEND_API_KEY
    params: dict = {
        "from": from_email,
        "to": [to],
        "subject": subject,
    }
    if html:
        params["html"] = html
    if text:
        params["text"] = text
    email = resend.Emails.send(params)
    return {"id": email["id"], "status": "sent"}


def main():
    parser = argparse.ArgumentParser(description="Send emails via Resend API")
    sub = parser.add_subparsers(dest="command", required=True)

    p_send = sub.add_parser("send")
    p_send.add_argument("--to", required=True)
    p_send.add_argument("--subject", required=True)
    p_send.add_argument("--body", help="HTML body")
    p_send.add_argument("--text", help="Plain text body")
    p_send.add_argument("--from-email", default="support@myconsilium.xyz")

    args = parser.parse_args()

    try:
        if args.command == "send":
            result = send_email(
                to=args.to,
                subject=args.subject,
                html=args.body,
                text=args.text,
                from_email=args.from_email,
            )
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()

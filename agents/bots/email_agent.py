import argparse
import json
import os
import subprocess
import sys

from agents.core.base import run_claude, build_base_prompt, run_continuous, setup_logging, AGENTS_DIR
from agents.core.subagents import get_subagents

logger = setup_logging("email_agent")

AGENT_RULES = """
## Email Agent Rules

1. Read the email carefully and identify the sender's name and email address.
2. Look up the sender's account using `db_lookup user --email <sender_email>`.
3. Investigate context:
   - Check their subscription status with `stripe_api get-subscription --email <sender_email>`.
   - If the question is about the product, read the relevant codebase files.
4. Use the **plan** subagent to create a comprehensive action plan. Register each step with TaskCreate.
5. Classify the email and handle accordingly:
   - **Support question** -> Investigate the issue, then reply directly via `gmail_api reply`.
   - **Billing question** -> Look up subscription and invoices, then reply with details.
   - **Cancellation request** -> If no reason given, ask for one. Cancel at period end via Stripe. If there is actionable product signal, log a Linear issue.
   - **Bug report** -> Investigate the bug, create a Linear issue, reply acknowledging the report.
   - **Feature request** -> Create a Linear issue, reply thanking the sender.
   - **B2B inquiry / investor / complex** -> Draft a message in Slack via `notify_slack --escalate`. Do NOT reply to the email directly.
   - **Spam** -> Trash the email. No notification needed.
6. Before sending ANY reply, use the **verify-response** subagent to check accuracy, tone, and completeness.
7. After replying: mark the email as read, archive it, and notify Slack ops channel.
8. Track every processed email in memory to avoid reprocessing.
"""


def _build_system_prompt():
    return build_base_prompt(
        role_description="You are Consilium's automated email support agent. You monitor incoming emails, classify them, investigate context, and respond autonomously.",
        agent_rules=AGENT_RULES,
    )


def process_emails(email_account, limit=10, model="sonnet", dry_run=False):
    logger.info("Fetching unreplied emails for %s (limit=%d)", email_account, limit)

    try:
        result = subprocess.run(
            [sys.executable, "-m", "agents.tools.gmail_api", "list-unreplied", "--email", email_account, "--limit", str(limit)],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            logger.error("Failed to fetch emails: %s", result.stderr)
            return
        emails = json.loads(result.stdout) if result.stdout.strip() else []
    except Exception:
        logger.exception("Error fetching emails")
        return

    if not emails:
        logger.info("No unreplied emails found")
        return

    memory_path = AGENTS_DIR / "memory" / "processed_emails.json"
    processed = set()
    if memory_path.exists():
        try:
            processed = set(json.loads(memory_path.read_text(encoding="utf-8")))
        except Exception:
            pass

    system_prompt = _build_system_prompt()
    subagents = get_subagents("plan", "verify-response")

    for email in emails:
        email_id = email.get("id", "")
        if email_id in processed:
            logger.info("Skipping already-processed email %s", email_id)
            continue

        subject = email.get("subject", "(no subject)")
        sender = email.get("from", "unknown")
        body = email.get("body", "")

        logger.info("Processing email from %s: %s", sender, subject)

        prompt = (
            f"New email received:\n"
            f"ID: {email_id}\n"
            f"From: {sender}\n"
            f"Subject: {subject}\n"
            f"Body:\n{body}\n\n"
            f"{'DRY RUN - do not actually send replies or modify anything.' if dry_run else 'Process this email according to your rules.'}"
        )

        response = run_claude(prompt, system_prompt=system_prompt, model=model, subagents=subagents)
        logger.info("Agent response for %s: %s", email_id, response[:200])

        processed.add(email_id)
        try:
            memory_path.parent.mkdir(parents=True, exist_ok=True)
            memory_path.write_text(json.dumps(sorted(processed)), encoding="utf-8")
        except Exception:
            logger.exception("Failed to update processed emails memory")


def run_once(args):
    process_emails(
        email_account=args.email,
        limit=args.limit,
        model=args.model,
        dry_run=args.dry_run,
    )


def main():
    parser = argparse.ArgumentParser(description="Consilium Email Support Agent")
    parser.add_argument("--email", default=os.environ.get("CONSILIUM_SUPPORT_EMAIL", "support@myconsilium.xyz"))
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--model", default="sonnet")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--continuous", action="store_true")
    parser.add_argument("--poll-interval", type=int, default=300)
    args = parser.parse_args()

    if args.continuous:
        run_continuous(lambda: process_emails(args.email, args.limit, args.model, args.dry_run), args.poll_interval, name="email_agent")
    else:
        run_once(args)


if __name__ == "__main__":
    main()

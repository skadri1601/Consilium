import argparse
import json
import re
import subprocess
import sys

from agents.core.base import run_continuous, setup_logging, AGENTS_DIR

logger = setup_logging("github_listener")

TICKET_PATTERN = re.compile(r"MYC-\d+")


def _run_tool(tool_module, *args):
    try:
        result = subprocess.run(
            [sys.executable, "-m", tool_module, *args],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            logger.error("Tool %s failed: %s", tool_module, result.stderr)
            return None
        return json.loads(result.stdout) if result.stdout.strip() else None
    except Exception:
        logger.exception("Error running %s", tool_module)
        return None


def _extract_ticket(pr):
    branch = pr.get("head", {}).get("ref", "")
    title = pr.get("title", "")
    for source in [branch, title]:
        match = TICKET_PATTERN.search(source)
        if match:
            return match.group()
    return None


def _load_memory():
    memory_path = AGENTS_DIR / "memory" / "processed_prs.json"
    if memory_path.exists():
        try:
            return json.loads(memory_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_memory(memory):
    memory_path = AGENTS_DIR / "memory" / "processed_prs.json"
    try:
        memory_path.parent.mkdir(parents=True, exist_ok=True)
        memory_path.write_text(json.dumps(memory, indent=2), encoding="utf-8")
    except Exception:
        logger.exception("Failed to save PR memory")


def _transition_linear(ticket_id, state, dry_run=False):
    if dry_run:
        logger.info("[DRY RUN] Would transition %s to %s", ticket_id, state)
        return
    _run_tool("agents.tools.linear_api", "transition", "--identifier", ticket_id, "--state", state)


def _notify_slack(message, dry_run=False):
    if dry_run:
        logger.info("[DRY RUN] Would notify Slack: %s", message)
        return
    _run_tool("agents.tools.notify_slack", "--action", "GitHub PR Update", "--summary", message)


def process_prs(model="sonnet", dry_run=False):
    memory = _load_memory()

    open_prs = _run_tool("agents.tools.github_api", "list-prs", "--state", "open")
    if open_prs:
        for pr in open_prs:
            pr_number = str(pr.get("number", ""))
            pr_state = pr.get("state", "")
            pr_title = pr.get("title", "")
            ticket_id = _extract_ticket(pr)
            state_key = f"{pr_number}:{pr_state}"

            if memory.get(pr_number) == state_key:
                continue

            logger.info("Processing open PR #%s: %s", pr_number, pr_title)

            if ticket_id:
                _transition_linear(ticket_id, "In Review", dry_run=dry_run)
                _notify_slack(f"PR #{pr_number} ({pr_title}) opened for {ticket_id} - moved to In Review", dry_run=dry_run)
            else:
                _notify_slack(f"PR #{pr_number} ({pr_title}) opened (no Linear ticket found)", dry_run=dry_run)

            memory[pr_number] = state_key

    closed_prs = _run_tool("agents.tools.github_api", "list-prs", "--state", "closed")
    if closed_prs:
        for pr in closed_prs:
            pr_number = str(pr.get("number", ""))
            merged = pr.get("merged_at") is not None or pr.get("merged", False)
            pr_title = pr.get("title", "")
            ticket_id = _extract_ticket(pr)
            state_key = f"{pr_number}:{'merged' if merged else 'closed'}"

            if memory.get(pr_number) == state_key:
                continue

            logger.info("Processing closed PR #%s (merged=%s): %s", pr_number, merged, pr_title)

            if ticket_id:
                if merged:
                    _transition_linear(ticket_id, "Done", dry_run=dry_run)
                    _notify_slack(f"PR #{pr_number} ({pr_title}) merged - {ticket_id} moved to Done", dry_run=dry_run)
                else:
                    _transition_linear(ticket_id, "In Progress", dry_run=dry_run)
                    _notify_slack(f"PR #{pr_number} ({pr_title}) closed without merge - {ticket_id} moved to In Progress", dry_run=dry_run)

            memory[pr_number] = state_key

    _save_memory(memory)


def main():
    parser = argparse.ArgumentParser(description="Consilium GitHub PR Listener")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--continuous", action="store_true")
    parser.add_argument("--poll-interval", type=int, default=120)
    args = parser.parse_args()

    if args.continuous:
        run_continuous(lambda: process_prs(dry_run=args.dry_run), args.poll_interval, name="github_listener")
    else:
        process_prs(dry_run=args.dry_run)


if __name__ == "__main__":
    main()

import argparse
import json
import re
import os
from datetime import datetime, timezone
from pathlib import Path

from agents.config import GITHUB_TOKEN, GITHUB_REPO, SLACK_BOT_TOKEN, SLACK_NOTIFICATION_CHANNEL
from agents.core.base import setup_logging, run_continuous
from agents.core.utils import run_tool as _run_tool, post_slack as _post_slack

logger = setup_logging("github_listener")

STATE_FILE = Path(__file__).resolve().parent.parent / "memory" / "github_state.json"

TICKET_PATTERN = re.compile(r"(MYC-\d+)", re.IGNORECASE)


def _load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"pr_states": {}, "seen_comments": []}


def _save_state(state):
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2, default=str), encoding="utf-8")


def _extract_ticket(pr):
    branch = pr.get("branch", "")
    title = pr.get("title", "")
    m = TICKET_PATTERN.search(branch) or TICKET_PATTERN.search(title)
    return m.group(1).upper() if m else None


def _transition_linear(ticket_id, state_name):
    try:
        _run_tool("agents.tools.linear_api", "transition", "--identifier", ticket_id, "--state", state_name)
        logger.info("Linear %s -> %s", ticket_id, state_name)
    except Exception as e:
        logger.warning("Linear transition failed: %s", e)


def _github_api(endpoint):
    import requests
    url = f"https://api.github.com/repos/{GITHUB_REPO}/{endpoint}"
    headers = {"Authorization": f"token {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.warning("GitHub API failed: %s", e)
        return None


def check_prs(state):
    if not GITHUB_TOKEN or not GITHUB_REPO:
        return

    pr_states = state.get("pr_states", {})

    for pr_state in ["open", "closed"]:
        prs = _github_api(f"pulls?state={pr_state}&per_page=20&sort=updated&direction=desc")
        if not prs:
            continue

        for pr in prs:
            pr_num = str(pr.get("number", ""))
            title = pr.get("title", "")
            branch = pr.get("head", {}).get("ref", "")
            merged = pr.get("merged_at") is not None
            pr_url = pr.get("html_url", "")
            author = pr.get("user", {}).get("login", "?")

            ticket_id = None
            m = TICKET_PATTERN.search(branch) or TICKET_PATTERN.search(title)
            if m:
                ticket_id = m.group(1).upper()

            old_state = pr_states.get(pr_num, {})
            old_status = old_state.get("status")

            if pr_state == "open" and old_status != "open":
                _post_slack(
                    f":github: *PR #{pr_num} Opened*\n"
                    f"*Title:* {title}\n"
                    f"*Branch:* `{branch}` | *Author:* {author}\n"
                    f"{'*Ticket:* ' + ticket_id if ticket_id else '_No ticket linked_'}\n"
                    f"<{pr_url}|View PR>"
                )
                if ticket_id:
                    _transition_linear(ticket_id, "In Review")
                pr_states[pr_num] = {"status": "open", "ticket": ticket_id, "title": title}

            elif pr_state == "closed" and merged and old_status != "merged":
                _post_slack(
                    f":white_check_mark: *PR #{pr_num} Merged*\n"
                    f"*Title:* {title}\n"
                    f"{'*Ticket:* ' + ticket_id + ' -> Done' if ticket_id else ''}\n"
                    f"<{pr_url}|View PR>"
                )
                if ticket_id:
                    _transition_linear(ticket_id, "Done")
                pr_states[pr_num] = {"status": "merged", "ticket": ticket_id, "title": title}

            elif pr_state == "closed" and not merged and old_status != "closed":
                if ticket_id:
                    _transition_linear(ticket_id, "In Progress")
                pr_states[pr_num] = {"status": "closed", "ticket": ticket_id, "title": title}

    state["pr_states"] = pr_states


def check_review_comments(state):
    if not GITHUB_TOKEN or not GITHUB_REPO:
        return

    seen = set(state.get("seen_comments", []))
    comments = _github_api("pulls/comments?sort=created&direction=desc&per_page=10")
    if not comments:
        return

    for comment in comments:
        cid = str(comment.get("id", ""))
        if cid in seen:
            continue

        body = comment.get("body", "")[:500]
        author = comment.get("user", {}).get("login", "?")
        pr_url = comment.get("pull_request_url", "")
        pr_num = pr_url.split("/")[-1] if pr_url else "?"
        path = comment.get("path", "")

        if author in ("github-actions[bot]", "dependabot[bot]"):
            seen.add(cid)
            continue

        _post_slack(
            f":speech_balloon: *PR #{pr_num} Review Comment* by {author}\n"
            f"*File:* `{path}`\n"
            f"{body}"
        )
        seen.add(cid)

    state["seen_comments"] = list(seen)[-200:]


def run_cycle():
    state = _load_state()
    check_prs(state)
    check_review_comments(state)
    _save_state(state)


def main():
    parser = argparse.ArgumentParser(description="Consilium GitHub Listener")
    parser.add_argument("--interval", type=int, default=120)
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--continuous", action="store_true")
    args = parser.parse_args()

    if args.once:
        run_cycle()
        return

    run_continuous(run_cycle, poll_interval=args.interval, name="github_listener")


if __name__ == "__main__":
    main()

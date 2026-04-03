"""GitHub API tool for managing pull requests and linking to Linear tickets.

Usage:
  python -m agents.tools.github_api list-prs [--state open] [--limit 10]
  python -m agents.tools.github_api get-pr --number 15
  python -m agents.tools.github_api find-ticket-prs --ticket CON-42
"""

import argparse
import json
import re
import sys

import requests

from agents.config import GITHUB_TOKEN, GITHUB_REPO

BASE_URL = "https://api.github.com"
TICKET_PATTERN = re.compile(r"CON-\d+")


def _headers() -> dict:
    return {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }


def _owner_repo() -> tuple[str, str]:
    owner, repo = GITHUB_REPO.split("/")
    return owner, repo


def list_prs(state: str = "open", limit: int = 10) -> list[dict]:
    owner, repo = _owner_repo()
    resp = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls",
        headers=_headers(),
        params={"state": state, "per_page": limit},
    )
    resp.raise_for_status()
    return [
        {
            "number": pr["number"],
            "title": pr["title"],
            "state": pr["state"],
            "branch": pr["head"]["ref"],
            "user": pr["user"]["login"],
            "created_at": pr["created_at"],
            "html_url": pr["html_url"],
        }
        for pr in resp.json()
    ]


def get_pr(number: int) -> dict:
    owner, repo = _owner_repo()
    resp = requests.get(
        f"{BASE_URL}/repos/{owner}/{repo}/pulls/{number}",
        headers=_headers(),
    )
    resp.raise_for_status()
    pr = resp.json()
    return {
        "number": pr["number"],
        "title": pr["title"],
        "state": pr["state"],
        "body": pr.get("body"),
        "branch": pr["head"]["ref"],
        "user": pr["user"]["login"],
        "merged": pr.get("merged", False),
        "mergeable": pr.get("mergeable"),
        "created_at": pr["created_at"],
        "html_url": pr["html_url"],
    }


def extract_ticket_id(text: str) -> str | None:
    match = TICKET_PATTERN.search(text)
    return match.group(0) if match else None


def find_ticket_prs(ticket_id: str) -> list[dict]:
    all_prs = list_prs(state="all", limit=100)
    return [
        pr
        for pr in all_prs
        if ticket_id in pr["title"] or ticket_id in pr["branch"]
    ]


def main():
    parser = argparse.ArgumentParser(description="GitHub API tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list-prs")
    p_list.add_argument("--state", default="open")
    p_list.add_argument("--limit", type=int, default=10)

    p_get = sub.add_parser("get-pr")
    p_get.add_argument("--number", type=int, required=True)

    p_ticket = sub.add_parser("find-ticket-prs")
    p_ticket.add_argument("--ticket", required=True)

    args = parser.parse_args()

    try:
        if args.command == "list-prs":
            result = list_prs(args.state, args.limit)
        elif args.command == "get-pr":
            result = get_pr(args.number)
        elif args.command == "find-ticket-prs":
            result = find_ticket_prs(args.ticket)
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()

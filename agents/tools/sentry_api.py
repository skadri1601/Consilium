"""Sentry error tracking tool for fetching issues, events, and error trends.

Usage:
  python -m agents.tools.sentry_api list-issues [--query "is:unresolved"] [--limit 10]
  python -m agents.tools.sentry_api get-issue --issue-id ISSUE_ID
  python -m agents.tools.sentry_api issue-events --issue-id ISSUE_ID [--limit 5]
  python -m agents.tools.sentry_api stats [--period 24h]
  python -m agents.tools.sentry_api search --query "error message text" [--limit 10]
"""

import argparse
import json
import sys
from datetime import datetime, timezone, timedelta

import requests

from agents.config import SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

BASE_URL = "https://sentry.io/api/0"


def _headers():
    return {"Authorization": f"Bearer {SENTRY_AUTH_TOKEN}"}


def _check_config():
    if not SENTRY_AUTH_TOKEN:
        return {"error": "SENTRY_AUTH_TOKEN not configured"}
    return None


def list_issues(query="is:unresolved", limit=10):
    err = _check_config()
    if err:
        return err
    url = f"{BASE_URL}/projects/{SENTRY_ORG}/{SENTRY_PROJECT}/issues/"
    resp = requests.get(url, headers=_headers(), params={"query": query, "limit": limit})
    resp.raise_for_status()
    issues = []
    for i in resp.json():
        issues.append({
            "id": i["id"],
            "title": i["title"],
            "culprit": i.get("culprit", ""),
            "level": i.get("level", ""),
            "status": i.get("status", ""),
            "count": i.get("count", "0"),
            "first_seen": i.get("firstSeen", ""),
            "last_seen": i.get("lastSeen", ""),
            "short_id": i.get("shortId", ""),
            "permalink": i.get("permalink", ""),
        })
    return issues


def get_issue(issue_id):
    err = _check_config()
    if err:
        return err
    url = f"{BASE_URL}/issues/{issue_id}/"
    resp = requests.get(url, headers=_headers())
    resp.raise_for_status()
    i = resp.json()
    return {
        "id": i["id"],
        "title": i["title"],
        "culprit": i.get("culprit", ""),
        "level": i.get("level", ""),
        "status": i.get("status", ""),
        "count": i.get("count", "0"),
        "user_count": i.get("userCount", 0),
        "first_seen": i.get("firstSeen", ""),
        "last_seen": i.get("lastSeen", ""),
        "short_id": i.get("shortId", ""),
        "permalink": i.get("permalink", ""),
        "metadata": i.get("metadata", {}),
        "tags": [{t["key"]: t["value"]} for t in i.get("tags", [])[:10]],
    }


def issue_events(issue_id, limit=5):
    err = _check_config()
    if err:
        return err
    url = f"{BASE_URL}/issues/{issue_id}/events/"
    resp = requests.get(url, headers=_headers(), params={"limit": limit})
    resp.raise_for_status()
    events = []
    for e in resp.json():
        events.append({
            "id": e["id"],
            "title": e.get("title", ""),
            "message": e.get("message", "")[:500],
            "timestamp": e.get("dateCreated", ""),
            "tags": {t["key"]: t["value"] for t in e.get("tags", [])[:10]},
        })
    return events


def stats(period="24h"):
    err = _check_config()
    if err:
        return err
    url = f"{BASE_URL}/projects/{SENTRY_ORG}/{SENTRY_PROJECT}/stats/"
    resp = requests.get(url, headers=_headers(), params={"stat": "received", "resolution": "1h"})
    if resp.status_code != 200:
        unresolved = list_issues("is:unresolved", limit=100)
        if isinstance(unresolved, dict) and "error" in unresolved:
            return unresolved
        return {
            "unresolved_count": len(unresolved),
            "period": period,
            "top_issues": unresolved[:5],
        }
    data = resp.json()
    total_events = sum(point[1] for point in data) if data else 0
    unresolved = list_issues("is:unresolved", limit=100)
    unresolved_count = len(unresolved) if isinstance(unresolved, list) else 0
    return {
        "total_events": total_events,
        "unresolved_count": unresolved_count,
        "period": period,
        "top_issues": unresolved[:5] if isinstance(unresolved, list) else [],
    }


def search(query, limit=10):
    return list_issues(query=query, limit=limit)


def main():
    parser = argparse.ArgumentParser(description="Sentry error tracking tool")
    sub = parser.add_subparsers(dest="command", required=True)

    p_list = sub.add_parser("list-issues")
    p_list.add_argument("--query", default="is:unresolved")
    p_list.add_argument("--limit", type=int, default=10)

    p_get = sub.add_parser("get-issue")
    p_get.add_argument("--issue-id", required=True)

    p_events = sub.add_parser("issue-events")
    p_events.add_argument("--issue-id", required=True)
    p_events.add_argument("--limit", type=int, default=5)

    p_stats = sub.add_parser("stats")
    p_stats.add_argument("--period", default="24h")

    p_search = sub.add_parser("search")
    p_search.add_argument("--query", required=True)
    p_search.add_argument("--limit", type=int, default=10)

    args = parser.parse_args()

    try:
        if args.command == "list-issues":
            result = list_issues(args.query, args.limit)
        elif args.command == "get-issue":
            result = get_issue(args.issue_id)
        elif args.command == "issue-events":
            result = issue_events(args.issue_id, args.limit)
        elif args.command == "stats":
            result = stats(args.period)
        elif args.command == "search":
            result = search(args.query, args.limit)
        json.dump(result, sys.stdout, indent=2)
    except Exception as e:
        json.dump({"error": str(e)}, sys.stdout)
        sys.exit(1)


if __name__ == "__main__":
    main()

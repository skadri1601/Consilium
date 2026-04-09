"""Recommends what to work on next based on Linear tickets, Sentry errors, and open PRs.

Usage:
  python -m agents.tools.prioritizer recommend
  python -m agents.tools.prioritizer summary
"""

import argparse
import json
import subprocess
import sys

from agents.core.base import setup_logging

logger = setup_logging("prioritizer")


def _run_tool(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except Exception:
        pass
    return None


def _score_linear_issues():
    items = []
    issues = _run_tool("agents.tools.linear_api", "search", "", "--limit", "20")
    if not issues:
        return items
    for i in issues:
        score = 0
        state = i.get("state", {}).get("name", "")
        priority = i.get("priority", 0)
        if state == "Urgent":
            score += 100
        elif state == "In Progress":
            score += 80
        elif state == "Todo":
            score += 50
        elif state == "Backlog":
            score += 20
        if priority:
            score += (5 - priority) * 15
        items.append({
            "type": "linear",
            "id": i.get("identifier", ""),
            "title": i.get("title", ""),
            "state": state,
            "score": score,
            "reason": f"Priority {priority}, state: {state}",
            "url": i.get("url", ""),
        })
    return items


def _score_sentry_issues():
    items = []
    issues = _run_tool("agents.tools.sentry_api", "list-issues", "--query", "is:unresolved", "--limit", "10")
    if not issues or isinstance(issues, dict):
        return items
    for i in issues:
        score = 0
        count = int(i.get("count", "0"))
        level = i.get("level", "")
        if level == "fatal":
            score += 120
        elif level == "error":
            score += 90
        elif level == "warning":
            score += 40
        if count > 100:
            score += 30
        elif count > 10:
            score += 15
        items.append({
            "type": "sentry",
            "id": i.get("short_id", ""),
            "title": i.get("title", ""),
            "state": f"{level} ({count}x)",
            "score": score,
            "reason": f"{level} level, {count} occurrences",
            "url": i.get("permalink", ""),
        })
    return items


def _score_prs():
    items = []
    prs = _run_tool("agents.tools.github_api", "list-prs", "--state", "open")
    if not prs:
        return items
    for pr in prs:
        score = 60
        items.append({
            "type": "github_pr",
            "id": f"#{pr.get('number', '?')}",
            "title": pr.get("title", ""),
            "state": "open",
            "score": score,
            "reason": "Open PR needs review/merge",
            "url": pr.get("url", ""),
        })
    return items


def recommend():
    all_items = []
    all_items.extend(_score_linear_issues())
    all_items.extend(_score_sentry_issues())
    all_items.extend(_score_prs())
    all_items.sort(key=lambda x: x["score"], reverse=True)
    top = all_items[:5]
    return {
        "recommendations": top,
        "total_items": len(all_items),
    }


def summary():
    rec = recommend()
    lines = ["*What to work on next:*\n"]
    for i, item in enumerate(rec.get("recommendations", []), 1):
        icon = {"linear": ":ticket:", "sentry": ":rotating_light:", "github_pr": ":github:"}.get(item["type"], ":pushpin:")
        lines.append(f"{i}. {icon} [{item['type'].upper()}] *{item['id']}* {item['title']}")
        lines.append(f"   _{item['reason']}_")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Task prioritizer")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("recommend")
    sub.add_parser("summary")
    args = parser.parse_args()

    if args.command == "recommend":
        result = recommend()
        json.dump(result, sys.stdout, indent=2)
    elif args.command == "summary":
        print(summary())


if __name__ == "__main__":
    main()

"""Shared persistent memory for tracking processed items, observations, and user context.

Usage:
  python -m agents.tools.memory_tool read [--key observations]
  python -m agents.tools.memory_tool write --key observations --value "New observation text"
  python -m agents.tools.memory_tool search --query "billing"
  python -m agents.tools.memory_tool track --type email --id msg123 --status handled --summary "Replied to billing question"
  python -m agents.tools.memory_tool check --type email --id msg123
  python -m agents.tools.memory_tool context --email user@example.com --note "Had billing issue, resolved"
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

MEMORY_DIR = Path(__file__).resolve().parent.parent / "memory"
MEMORY_FILE = MEMORY_DIR / "shared_memory.json"

DEFAULT_MEMORY = {
    "observations": [],
    "processed_emails": {},
    "processed_prs": {},
    "processed_conversations": {},
    "user_context": {},
    "patterns": [],
    "last_updated": None,
}


def _load() -> dict:
    if not MEMORY_FILE.exists():
        MEMORY_DIR.mkdir(parents=True, exist_ok=True)
        _save(DEFAULT_MEMORY)
        return dict(DEFAULT_MEMORY)
    with open(MEMORY_FILE) as f:
        return json.load(f)


def _save(data: dict):
    data["last_updated"] = datetime.now(timezone.utc).isoformat()
    MEMORY_DIR.mkdir(parents=True, exist_ok=True)
    with open(MEMORY_FILE, "w") as f:
        json.dump(data, f, indent=2)


def read(key: str | None = None) -> dict:
    data = _load()
    if key:
        return {"key": key, "value": data.get(key)}
    return data


def write(key: str, value: str) -> dict:
    data = _load()
    if key in ("observations", "patterns") and isinstance(data.get(key), list):
        data[key].append(value)
    else:
        data[key] = value
    _save(data)
    return {"status": "written", "key": key}


def search(query: str) -> list[dict]:
    data = _load()
    results = []
    query_lower = query.lower()

    for k, v in data.items():
        if isinstance(v, str) and query_lower in v.lower():
            results.append({"key": k, "value": v})
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, str) and query_lower in item.lower():
                    results.append({"key": k, "value": item})
                elif isinstance(item, dict):
                    for val in item.values():
                        if isinstance(val, str) and query_lower in val.lower():
                            results.append({"key": k, "value": item})
                            break
        elif isinstance(v, dict):
            for sub_key, sub_val in v.items():
                if isinstance(sub_val, str) and query_lower in sub_val.lower():
                    results.append({"key": f"{k}.{sub_key}", "value": sub_val})
                elif isinstance(sub_val, dict):
                    for val in sub_val.values():
                        if isinstance(val, str) and query_lower in val.lower():
                            results.append({"key": f"{k}.{sub_key}", "value": sub_val})
                            break
    return results


def track(item_type: str, item_id: str, status: str, summary: str) -> dict:
    data = _load()
    bucket = f"processed_{item_type}s"
    if bucket not in data:
        data[bucket] = {}
    data[bucket][item_id] = {
        "status": status,
        "summary": summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _save(data)
    return {"status": "tracked", "type": item_type, "id": item_id}


def check(item_type: str, item_id: str) -> dict:
    data = _load()
    bucket = f"processed_{item_type}s"
    entry = data.get(bucket, {}).get(item_id)
    return {"processed": entry is not None, "entry": entry}


def add_context(email: str, note: str) -> dict:
    data = _load()
    if email not in data["user_context"]:
        data["user_context"][email] = []
    data["user_context"][email].append({
        "note": note,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    _save(data)
    return {"status": "added", "email": email}


def main():
    parser = argparse.ArgumentParser(description="Shared persistent memory tool")
    subs = parser.add_subparsers(dest="command", required=True)

    read_p = subs.add_parser("read")
    read_p.add_argument("--key", default=None)

    write_p = subs.add_parser("write")
    write_p.add_argument("--key", required=True)
    write_p.add_argument("--value", required=True)

    search_p = subs.add_parser("search")
    search_p.add_argument("--query", required=True)

    track_p = subs.add_parser("track")
    track_p.add_argument("--type", required=True, dest="item_type")
    track_p.add_argument("--id", required=True, dest="item_id")
    track_p.add_argument("--status", required=True)
    track_p.add_argument("--summary", required=True)

    check_p = subs.add_parser("check")
    check_p.add_argument("--type", required=True, dest="item_type")
    check_p.add_argument("--id", required=True, dest="item_id")

    ctx_p = subs.add_parser("context")
    ctx_p.add_argument("--email", required=True)
    ctx_p.add_argument("--note", required=True)

    args = parser.parse_args()

    if args.command == "read":
        result = read(args.key)
    elif args.command == "write":
        result = write(args.key, args.value)
    elif args.command == "search":
        result = search(args.query)
    elif args.command == "track":
        result = track(args.item_type, args.item_id, args.status, args.summary)
    elif args.command == "check":
        result = check(args.item_type, args.item_id)
    elif args.command == "context":
        result = add_context(args.email, args.note)

    json.dump(result, sys.stdout, indent=2)


if __name__ == "__main__":
    main()

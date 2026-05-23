#!/usr/bin/env bash
# statusLine hook: first line of stdout becomes the bottom-bar status. Reads session JSON on stdin.
set -uo pipefail

input="$(cat)"

model="$(printf '%s' "$input" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get("model", {}).get("display_name", ""))
except Exception:
    print("")
' 2>/dev/null || true)"

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "-")"
dir="$(basename "$(pwd)")"

printf '%s · %s · %s' "$dir" "$branch" "${model:-model}"

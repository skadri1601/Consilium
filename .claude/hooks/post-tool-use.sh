#!/usr/bin/env bash
# PostToolUse hook (matcher Edit|Write|MultiEdit): reads the tool-call JSON on stdin and
# surfaces a reminder when a shared package is edited. Never blocks; always exits 0.
set -uo pipefail

input="$(cat)"

file_path="$(printf '%s' "$input" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get("tool_input", {}).get("file_path", ""))
except Exception:
    print("")
' 2>/dev/null || true)"

case "$file_path" in
  *packages/shared/src/*)
    echo "Note: edited packages/shared — run \`pnpm --filter @consilium/shared build\` so api/web pick it up (they import from @consilium/shared/dist/)."
    ;;
esac

exit 0

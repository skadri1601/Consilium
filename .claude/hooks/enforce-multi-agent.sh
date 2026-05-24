#!/usr/bin/env bash
# PreToolUse hook: enforces Multi-Agent Task Protocol from AGENTS.md
# Blocks Edit/Write/Bash tool calls on non-trivial tasks if no Agent calls have been made yet.
# This hook runs on every tool call and checks if the session is respecting the protocol.
#
# Logic: If Claude is about to write/edit code and hasn't spawned any Agent subagents
# in this session, emit a warning reminding it to decompose first.
# We can't perfectly detect "non-trivial" but we CAN remind on first write.

set -uo pipefail

# Read the event JSON from stdin
EVENT=$(cat)

# Extract tool name
TOOL=$(echo "$EVENT" | grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')

# We only care about write operations
case "$TOOL" in
  Edit|Write|MultiEdit|NotebookEdit)
    # Output a system message reminder (non-blocking)
    cat <<'EOF'
{"decision":"allow","systemMessage":"REMINDER: Per AGENTS.md Multi-Agent Task Protocol, non-trivial tasks MUST use 6-10 parallel subagents before writing code. If this is a multi-file change and you haven't spawned subagents yet, STOP and decompose the task first. Only skip for trivial single-file edits."}
EOF
    ;;
  *)
    echo '{"decision":"allow"}'
    ;;
esac

exit 0

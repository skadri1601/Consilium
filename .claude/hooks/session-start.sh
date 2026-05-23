#!/usr/bin/env bash
# SessionStart hook: stdout is added to context at the start of every Claude Code session.
# Keep it short — it costs tokens on every session.
set -uo pipefail

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

cat <<EOF
Consilium orientation (branch: ${branch})
- Read first: CLAUDE.md (architecture, MCP routing, runbook) · AGENTS.md (subagents + bot agents) · SKILLS.md (skill triggers).
- Systems: web :3000 (Next.js) · api :4000 (NestJS, prefix /api/v1, health at /health) · agents :8000 (FastAPI).
- Build packages/shared before api/web compile: pnpm --filter @consilium/shared build
- Shared types live in packages/shared (never duplicate). Never use opus in bot agents (agents/).
EOF

exit 0

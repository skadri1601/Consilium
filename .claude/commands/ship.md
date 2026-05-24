---
description: Pre-flight checks before pushing — lint, type-check, and targeted tests across the monorepo. Does not deploy.
argument-hint: "[web|api|agents|all] (optional, defaults to changed packages)"
allowed-tools: Bash(pnpm:*), Bash(uv run:*), Bash(git status:*), Bash(git diff:*), Bash(git diff --stat:*)
---

Run the pre-flight checks Consilium expects before a push. Scope: `$ARGUMENTS` (if empty, infer the affected packages from `git diff --stat` against the upstream branch and check only those).

Steps:
1. Show what changed: `git status` and `git diff --stat`.
2. Lint: `pnpm lint` (turbo caches per package).
3. Type-check the affected package(s), e.g. `pnpm --filter @consilium/web type-check`, `pnpm --filter @consilium/api type-check`. For agents: `cd apps/agents && uv run ruff check src/`.
4. Tests for the affected package(s):
   - web: `pnpm --filter @consilium/web test -- --run`
   - api: `pnpm --filter @consilium/api test`
   - agents: `cd apps/agents && uv run pytest tests/deliberation/ -x`
5. Summarize results. Flag any **new** failures, but treat the documented pre-existing failures (Clerk/Resend-key Jest tests, the 1 Vitest Clerk import, the agents mock/assertion failures) as expected — see AGENTS.md.

Do NOT push, tag, or deploy. This command only reports readiness; the human decides whether to ship.

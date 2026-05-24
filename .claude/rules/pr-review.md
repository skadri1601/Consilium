---
description: PR review and creation rules — MANDATORY verification
globs: [".github/**", "PR-REVIEW.md", "AGENTS.md", "SKILLS.md"]
alwaysApply: true
---

HARD RULES:

- Read `PR-REVIEW.md` at project root for PR review guidelines before reviewing or creating PRs.
- Read `AGENTS.md` for agent behavior rules and `SKILLS.md` for available skill definitions.
- **Before creating a PR, ALWAYS run locally**: typecheck + tests for ALL changed packages. No exceptions.
- PR descriptions must include: Summary (what changed), Test plan (how to verify).
- CI workflows in `.github/workflows/ci.yml` run lint + typecheck on push/PR.
- `linear-sync.yml` syncs GitHub events to Linear (MYC- prefix) and Slack.
- **Never push directly** — provide the git commands for the user to review and execute.
- **Never create a PR without showing passing test output first.**

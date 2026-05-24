---
description: Rules for PR reviews and code quality
globs: [".github/**", "PR-REVIEW.md", "AGENTS.md", "SKILLS.md"]
alwaysApply: true
---

- Read `PR-REVIEW.md` at project root for PR review guidelines before reviewing or creating PRs
- Read `AGENTS.md` for agent behavior rules and `SKILLS.md` for available skill definitions
- The Consilium review action at `.github/actions/consilium-review/` runs multi-model deliberation on PR diffs
- Supported review modes: redteam (default), council, blind, jury, deep
- Before creating a PR, always run locally: typecheck + tests for all changed packages
- PR descriptions must include: Summary (what changed), Test plan (how to verify)
- CI workflows in `.github/workflows/ci.yml` run lint + typecheck on push/PR
- `linear-sync.yml` syncs GitHub events to Linear (MYC- prefix) and Slack

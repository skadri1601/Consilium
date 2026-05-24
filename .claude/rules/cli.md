---
description: CLI package rules — MANDATORY conventions
globs: ["packages/cli/**/*.ts"]
---

HARD RULES:

- **Import shared types from `@consilium/shared`** — never define DebateMode/DebateModeConfig locally.
- CLI-specific utilities (estimateCost, formatCostEstimate) stay in CLI package.
- All 8 debate modes must be supported: quick, council, deep, blind, redteam, jury, market, auto.
- After changes, run tests: `cd packages/cli && npx vitest run`
- After type changes, rebuild shared first: `pnpm --filter @consilium/shared build`
- **Never assume a command exists** — check Commander.js registration in the actual source.

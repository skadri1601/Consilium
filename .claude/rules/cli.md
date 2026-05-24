---
description: Rules for CLI package
globs: ["packages/cli/**/*.ts"]
---

- Import shared types from `@consilium/shared` — never define DebateMode/DebateModeConfig locally
- CLI-specific utilities (estimateCost, formatCostEstimate) stay in CLI package
- All 8 debate modes must be supported: quick, council, deep, blind, redteam, jury, market, auto
- After changes, run tests: `cd packages/cli && npx vitest run`
- After type changes, rebuild shared first: `cd packages/shared && npx tsc --build`

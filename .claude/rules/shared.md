---
description: Rules for shared package — single source of truth for types
globs: ["packages/shared/**/*.ts"]
---

- This is the SINGLE SOURCE OF TRUTH for shared types (DebateMode, Provider, SSE events)
- After changes, rebuild: `cd packages/shared && npx tsc --build`
- After rebuild, re-run CLI tests: `cd packages/cli && npx vitest run`
- Never add types here that are only used by one package
- Export new types from the appropriate `index.ts` barrel file

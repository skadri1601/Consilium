---
description: Shared types package — single source of truth, never duplicate
globs: ["packages/shared/**"]
---

HARD RULES:

- This is the **SINGLE SOURCE OF TRUTH** for shared types (DebateMode, Provider, SSE events).
- After changes, rebuild: `pnpm --filter @consilium/shared build`
- After rebuild, re-run CLI tests: `cd packages/cli && npx vitest run`
- **Never add types here that are only used by one package** — keep it lean.
- Export new types from the appropriate `index.ts` barrel file.
- If you change a type here, grep the entire codebase for usages and update them ALL.

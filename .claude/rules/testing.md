---
description: Testing rules — MANDATORY verification before claiming done
globs: ["**/*.test.*", "**/*.spec.*", "**/tests/**"]
---

HARD RULES:

- **Tests must match actual page/component content** — read the source before writing assertions. Never guess.
- Use `getAllByText` when multiple elements may match (e.g. tier names in pricing).
- Web tests: `cd apps/web && npx vitest run`
- CLI tests: `cd packages/cli && npx vitest run`
- API tests: `pnpm --filter @consilium/api test`
- Agents tests: `cd apps/agents && uv run pytest tests/`
- **Always run the full test suite** after fixing individual tests to catch regressions.
- **Pre-existing test failures must be fixed, not ignored.**
- **Never claim "done" or "passing" without showing actual test output.** Evidence before assertions.

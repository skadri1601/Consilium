---
description: Rules when modifying or creating test files
globs: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"]
---

- Tests must match actual page/component content — read the source before writing assertions
- Use `getAllByText` when multiple elements may match (e.g. tier names in pricing)
- Web tests: `cd apps/web && npx vitest run`
- CLI tests: `cd packages/cli && npx vitest run`
- Always run the full test suite after fixing individual tests to catch regressions
- Pre-existing test failures must be fixed, not ignored

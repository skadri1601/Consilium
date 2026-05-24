---
description: Rules for Next.js web application code
globs: ["apps/web/**/*.ts", "apps/web/**/*.tsx"]
---

- Import shared types from `@/features/*/types/` or `packages/shared` — never duplicate type definitions
- Use `buildMetadata()` from `@/lib/seo` for all page metadata
- Marketing pages are server components; use `"use client"` only when needed
- Clerk is NOT available on marketing pages — use cookie checks for auth state
- Use `cn()` from `@/shared/lib/utils` for conditional classNames
- Model IDs use full versions: `claude-haiku-4-5-20251001`, `claude-sonnet-4-20250514`
- After modifying components, run: `npx vitest run --config apps/web/vitest.config.ts`
- After modifying types or imports, run: `npx tsc --noEmit -p apps/web/tsconfig.json`

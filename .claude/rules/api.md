---
description: NestJS API backend rules — MANDATORY conventions
globs: ["apps/api/**/*.ts"]
---

HARD RULES:

- **Never return 200 with empty data when backend is unreachable** — use 503.
- Stripe webhook handlers must throw on processing failure, not swallow errors.
- All new modules must be registered in `app.module.ts`.
- Use ClerkAuthGuard for protected endpoints.
- Database access through Prisma service only.
- After changes, typecheck: `npx tsc --noEmit -p apps/api/tsconfig.json`
- **Never add dependencies without checking if they already exist in package.json.**

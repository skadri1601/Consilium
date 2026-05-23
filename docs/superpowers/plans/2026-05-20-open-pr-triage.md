# Open PR Triage — 2026-05-20

Triage of the 19 open PRs on `skadri1601/consilium` (plus our own PR #91), as of `2026-05-20`. Source-of-truth pulled via the GitHub MCP `list_pull_requests` / `pull_request_read` tools — no PRs were merged, closed, approved, rebased, or commented on as part of this triage.

## Snapshot

| Category | Count | PRs |
| --- | --- | --- |
| Our active PR | 1 | #91 |
| Dependabot (npm grouped) | 2 | #90, #89 |
| Dependabot (pip /apps/agents) | 5 | #74, #73, #72, #71, #70 |
| Dependabot (GitHub Actions) | 3 | #69, #68, #67 |
| Feature PRs (own work) | 5 | #86, #85, #57, #33, #24 |
| Stack PRs (nested base branches) | 3 | #18, #17, #16 |
| Drafts | 1 | #31 (draft) |
| **Total open** | **20** | (including #91) |

Of the 11 Dependabot PRs, **9 are likely to merge cleanly after PR #91 lands** (the 3 GitHub Actions bumps, the 5 pip /apps/agents bumps, and the dev-deps npm group with one trivial-to-rebase conflict). The two grouped npm bumps (#90, #89) directly conflict with PR #91 because all three touch `apps/web/package.json` + `pnpm-lock.yaml`.

## PR #91 — files we touch on `claude/consilium-remaining-tasks-UuSLC`

Anything in another PR that overlaps with these files needs a rebase after #91 lands.

- `apps/api/jest.config.js`
- `apps/api/src/features/webhooks/clerk-webhooks.integration.spec.ts`
- `apps/web/package.json` (bumps `@vitejs/plugin-react` 6.0.1 -> 5.2.0)
- `apps/web/src/test/setup.ts`
- `.github/actions/consilium-debate/{action.yml,README.md}` (new)
- `packages/cli/**` (massive surface area — 60+ files added/modified)
- `pnpm-lock.yaml`
- `sonar-project.properties`
- `docs/superpowers/plans/2026-05-20-*.md` (6 new), `docs/superpowers/specs/2026-05-20-*.md` (2 new)

## PR-by-PR triage

Legend for `status`:

- `mergeable` — GitHub reports no conflicts and CI was last green/unstable (CI quirks, not merge conflicts).
- `conflicts` — touches one or more files we change on PR #91, so will need rebase.
- `needs-review` — older, stale; needs reviewer eyes before any action.

### Dependabot — npm grouped (HIGH conflict risk vs. PR #91)

| PR | Title | Head | Status | Action |
| --- | --- | --- | --- | --- |
| #90 | bump prod-dependencies group across 1 dir (20 updates) | `dependabot/npm_and_yarn/prod-dependencies-81465f17d5` | conflicts | **HOLD** until PR #91 lands, then comment `@dependabot recreate` to rebase against new `pnpm-lock.yaml` |
| #89 | bump dev-dependencies group across 1 dir (18 updates) | `dependabot/npm_and_yarn/dev-dependencies-e63801bae1` | conflicts | **HOLD** until PR #91 lands, then comment `@dependabot recreate`; review TypeScript 5.9 -> 6.0 + Prisma 6 -> 7 + Tailwind 3 -> 4 separately (those are not safe auto-merges) |

Direct conflict points:

- **#90 vs #91** — both edit `apps/web/package.json` `devDependencies` and the entire `pnpm-lock.yaml`. #90 also bumps `typescript` 5.9 -> 6.0 across every package, `@prisma/client` 6 -> 7, `recharts` 2 -> 3, `next` 16.2.5 -> 16.2.6. These are not pure patch bumps — review carefully even after rebase.
- **#89 vs #91** — both edit `apps/web/package.json` line `@vitejs/plugin-react` (we pin 5.2.0; #89 wants 6.0.2) and `pnpm-lock.yaml`. #89 also raises `eslint` 9 -> 10, `prisma` 6 -> 7, `vite` 7 -> 8, `tailwindcss` 3 -> 4. Same caveat: not auto-mergeable on content grounds.

### Dependabot — pip /apps/agents (NO conflict with PR #91)

PR #91 does not touch `apps/agents/pyproject.toml` or `poetry.lock`. These are individually safe to land in any order.

| PR | Bump | Files | Status | Action |
| --- | --- | --- | --- | --- |
| #74 | anthropic 0.40 -> 0.99 | `pyproject.toml`, `poetry.lock` | needs-review | **Major API surface change** (Workload Identity Federation, OAuth, auth profiles). Hold; smoke-test `apps/agents/src/shared/clients/anthropic_client.py` before approving. Not safe auto-merge. |
| #73 | pydantic-settings 2.13.1 -> 2.14.0 | `poetry.lock` | mergeable | Auto-merge candidate after PR #91 lands. |
| #72 | ruff 0.8.6 -> 0.15.12 | `pyproject.toml`, `poetry.lock` | needs-review | Multi-major bump (7+ minor versions). New lint rules may flag existing code. Run `poetry run ruff check src/` locally before approving. |
| #71 | pre-commit 4.5.1 -> 4.6.0 | `poetry.lock` | mergeable | Auto-merge candidate. |
| #70 | sentry-sdk 2.58.0 -> 2.59.0 | `poetry.lock` | mergeable | Auto-merge candidate. |

### Dependabot — GitHub Actions (NO conflict with PR #91)

PR #91 only adds the new `.github/actions/consilium-debate/` composite action; it does not touch existing workflows. So these are independent.

| PR | Bump | Status | Action |
| --- | --- | --- | --- |
| #69 | actions/checkout 4 -> 6 (8 workflows) | mergeable | Auto-merge candidate. Requires runner v2.329.0+. |
| #68 | dorny/paths-filter 3 -> 4 | mergeable | Auto-merge candidate. Major bump only because of node24 runtime. |
| #67 | actions/setup-python 5 -> 6 (3 workflows) | mergeable | Auto-merge candidate. Requires runner v2.327.1+. |

### Feature PRs (own work)

| PR | Title | Head -> Base | Status | Action |
| --- | --- | --- | --- | --- |
| #86 | Agents: evaluation framework, governance, memory, telemetry, tools | `feature/Agents-main` -> `main` | needs-review | Large diff (+6270 / -953 across 79 files). `unstable` mergeable_state suggests CI red, not conflicts. PR body notes committed `.coverage.*` and `test_localsystem.txt` to clean up before merge. No overlap with PR #91. **Hold for reviewer attention.** |
| #85 | Implement actual agreement-level calculation in consensus workflow | `claude/implement-todo-item-HY20R` -> `main` | needs-review | Tiny diff (+43 / -1) in `apps/agents/src/workflows/consensus.py`. Author already manually sanity-tested the four edge cases. CI lint/typecheck not yet confirmed. **Easy win — recommend reviewing & merging independently of PR #91.** |
| #57 | spec for `startup_validation` deliberation template | `claude/research-startup-validation-prompts` -> `main` | needs-review | Docs-only (+312 lines in `docs/distribution/startup-validation-template-spec.md`). Awaiting a Go/No-Go decision from reviewer per PR body. **Decision-blocked, not code-blocked.** |
| #33 | Add `.cursor/Dockerfile` to fix Cloud Agent VM snapshot errors | `cursor/dev-env-setup-v2-30f7` -> `main` | mergeable | Self-contained: adds `.cursor/environment.json` + `.cursor/Dockerfile`. No overlap with PR #91. Has been silent since 2026-04-27 — author should confirm Cursor Cloud setup still works against current main, then merge. |
| #24 | feat(web): apply Consilium design system across all pages | `feature/design-main` -> `main` | needs-review | **Huge** (+19511 / -11778 across 303 files). Touches almost every web file including `apps/web/package.json` (would conflict with both #91 and the npm dependabot bumps). Has been open since 2026-04-21, last update 2026-04-29. **Hold — this needs an explicit rebase + visual QA pass before any merge.** |

### Drafts / Documentation

| PR | Title | Status | Action |
| --- | --- | --- | --- |
| #31 | Add Cursor Cloud dev environment setup instructions to AGENTS.md | draft, mergeable | Author intentionally left it as draft (paired companion to #33). Leave as-is. |

### Stack PRs (nested base branches — LIKELY ABANDONED)

These three PRs target non-`main` branches that themselves have never landed. They are closed-loop CI experiments from April 2026 that have been silent for over a month.

| PR | Title | Head -> Base | Status | Recommended action |
| --- | --- | --- | --- | --- |
| #18 | Feature/stripe integration | `feature/stripe-integration` -> `feature/main-payment` | needs-review | Targets `feature/main-payment` (unmerged stack base). Last activity 2026-04-19. Large (+3191 / -991 across 76 files). **Recommend the user closes** — Stripe integration should be re-opened as a fresh PR off `main` if still wanted; this branch will conflict heavily with #91, #86, #24 and any other long-running work. |
| #17 | chore(ci): verify pipeline health on nested PR | `claude/verify-pipeline-passing` -> `claude/debug-pipeline-failures-hfVcp` | needs-review | Pure "empty commit to verify CI" PR from 2026-04-16. The parent (#16) is itself stuck. **Recommend the user closes** as obsolete; whatever it was verifying has long since drifted. |
| #16 | fix(ci): resolve 27 failing pipeline checks | `claude/debug-pipeline-failures-hfVcp` -> `feature/main-engine` | needs-review | Targets `feature/main-engine` (unmerged stack base). Last activity 2026-04-16. The CI fixes it describes were either superseded by later commits to `main` or are no longer applicable. **Recommend the user closes** and re-opens any still-needed CI hardening as a fresh PR off `main`. |

## Conflict matrix — what blocks what

```
PR #91 (this branch)
    blocks #90 (apps/web/package.json + pnpm-lock.yaml overlap)
    blocks #89 (apps/web/package.json line-level conflict on @vitejs/plugin-react + pnpm-lock.yaml overlap)
    does NOT block #69, #68, #67 (GitHub Actions only)
    does NOT block #74, #73, #72, #71, #70 (Python only)
    does NOT block #86 (agents-only)
    does NOT block #85 (single Python file)
    does NOT block #57 (docs only)
    does NOT block #33 (.cursor/ only)
    might conflict with #24 (#24 touches apps/web/package.json with a different patch set — both will need rebase)

PR #24 (design-system overhaul, huge)
    blocks / is blocked by #90, #89 (overlapping package.json edits)
    blocks / is blocked by #91 (overlapping apps/web/package.json edit)
```

## Recommended ordering (no actions taken)

1. Land PR #91.
2. Trigger `@dependabot recreate` on #89 and #90 so they rebase onto the new `pnpm-lock.yaml`. After rebase: hand-review #90 (TypeScript 5 -> 6, Prisma 6 -> 7, recharts 2 -> 3 are not safe) and #89 (ESLint 9 -> 10, Prisma 6 -> 7, Vite 7 -> 8, Tailwind 3 -> 4 are not safe).
3. Independently of #91, the user can merge the trivial-bump dependabot PRs (#73, #71, #70, #69, #68, #67) any time. Each is `mergeable` and untouched by our work.
4. The user can independently land #85 (single-file Python TODO fix) and #33 (Cursor Dockerfile) after a quick reviewer pass.
5. For #86 (large agents PR) and #24 (huge design system PR), the user needs to budget review time; both should rebase against `main` after #91 lands and PR-specific CI is re-run.
6. The user should consider closing #16, #17, and #18 as stale/abandoned. **This triage does not close them — that is the user's call.**

## What was NOT done in this triage

- No PR was approved, merged, closed, rebased, or auto-merged.
- No comments were posted to any PR.
- No code changes were made anywhere outside this triage document.
- No pushes occurred to any branch other than `claude/consilium-remaining-tasks-UuSLC`.

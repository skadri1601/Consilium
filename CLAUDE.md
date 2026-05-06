# Consilium - AI Council Platform

## What This Is
Consilium is a multi-AI agent debate platform where models argue, critique, and synthesize consensus. It implements 8 deliberation modes backed by peer-reviewed research.

## Architecture

```
Web (Next.js 15) → API (NestJS 11/Fastify) → Agents (FastAPI/Python)
                                             ↓
                                    Debate Orchestrator
                                    ├── Round 1: Independent Analysis
                                    ├── Round 2: Cross-Examination
                                    ├── Round 3: Rebuttal & Refinement
                                    └── Judge: 5-Phase Synthesis
```

### Systems
| System | Path | Stack | Runs On |
|--------|------|-------|---------|
| Web App | apps/web/ | Next.js 15, Clerk auth, Stripe, shadcn/ui | Vercel |
| API | apps/api/ | NestJS 11, Fastify, BullMQ, Prisma | Render |
| Debate Engine | apps/agents/ | FastAPI, 5 LLM providers | Render / Droplet |
| Bot/DevOps | agents/ | Python, Sentry/Sonar poll | DigitalOcean droplet (optional) |
| CLI | packages/cli/ | TypeScript, Commander.js, SSE | User's machine |
| Database | packages/database/ | Prisma, Neon PostgreSQL | Neon |
| Shared Types | packages/shared/ | TypeScript | N/A (library) |

### Bot Infrastructure (agents/)
- **monitor_agent.py** - Polls Sentry and SonarQube on an interval; logs unresolved errors and gate changes
- **briefing_agent.py** - Builds a text digest (stdout) from Sentry, Vercel, SonarQube, and DB stats when run
- **run_all.py** - Orchestrator with max 10 restarts per child process, logs to agents/logs/

### Production URLs (reference)
- **Web app**: `https://myconsilium.xyz`
- **Nest API origin** (default `CONSILIUM_API_URL` in CLI and Python MCP, no path suffix): `https://api.myconsilium.xyz` - HTTP routes are under `/api/v1`. Health checks use `/health` at the API host root.

### Key Infrastructure
- **Redis**: Upstash (debate engine and other services; optional for agents telemetry)
- **DB**: Neon PostgreSQL via Prisma
- **Auth**: Clerk (web) + CLI tokens
- **Debate start vs SSE (queue + debug)**  
  - **No separate “SSE queue” flag**: SSE (`apps/api` → workers stream) only needs the same `debateId` and URL contract. “Run via queue” means **how the debate is started**: either direct HTTP `startDebate` or a BullMQ job that later calls the same `startDebate` with the **same payload fields** (`debateId`, `mode`, `debateSource`, persona/`systemPrompt`, `projectContext`, etc.).  
  - **`DEBATE_USE_QUEUE=true`**: `POST /debates` enqueues; the worker sets status to **processing** after workers accept the start; **completed** still comes from the **SSE** lifecycle (not when the job returns). A session can stay **pending** until the worker runs-clients may open SSE early; `queueJobId` on the session matches the Bull job id for correlation; job inspection uses `DebateQueueService.getJobStatus` in code (extend the API if you need a public status route).  
  - **API logging**: `API_DEBUG=true` or `LOG_LEVEL=debug` (see `.env.example`) raises Fastify/API verbosity (e.g. SSE proxy and debate start lines). **CLI tracing** stays on **`CONSILIUM_DEBUG`** in `packages/cli` (`utils/config.ts`, `api/client.ts`)-different surface from the API flags above.
- **Monitoring**: Sentry (consilium-pi org)
- **CI**: GitHub Actions (lint, typecheck, security, Claude Code review)
- **Linear**: Project management (MYC- ticket prefix)
- **Free-tier fallback**: BYOK always wins. When a debate request has no key for the requested provider (and no self-hosted `*_API_KEY` env var), the agents service routes through a platform-hosted pool: `CONSILIUM_FREE_TIER_GROQ_KEY` preferred, `CONSILIUM_FREE_TIER_OPENROUTER_KEY` as backup. Tier is inferred from catalog cost (fast / balanced / deep) and routed to an equivalent free model. Resolution logic lives in `apps/agents/src/features/free_tier/resolver.py`; fallback is surfaced via the `routing:fallback` SSE event and a CLI pre-flight notice in `packages/cli/src/commands/debate.ts`.

## Code Conventions

### Python (agents/, apps/agents/)
- No comments in code - use descriptive names
- Direct imports over subprocess where possible
- All models validated: only haiku/sonnet allowed for bot, opus blocked
- Recovery engine wraps external API calls
- Telemetry traces on task claim/complete/fail

### TypeScript (apps/web/, apps/api/, packages/)
- Shared types in packages/shared/ - never duplicate
- Model IDs use current versions: `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-7`, `gpt-5.4`/`gpt-5.5`, `gemini-3-flash-preview`/`gemini-3.1-pro-preview`. Legacy IDs (`gpt-4o`, `claude-3-5-*`, `gemini-2.x`) are aliased to current replacements but should not be hardcoded in new code.
- BullMQ for async debate processing
- SSE for real-time streaming

## What NOT To Do
- Never push to GitHub directly - provide git commands instead
- Never use opus model in bot agents
- Never add "Co-Authored-By" or "Generated by Claude Code" to commits
- Never copy code from C:\Users\kadri\answerThis (reference only)
- Never duplicate types that exist in packages/shared/
- Don't create documentation files unless explicitly asked
- Don't add comments to code unless asked

## External Integrations
| Service | Purpose | Config |
|---------|---------|--------|
| Slack | CI notifications only (webhook workflow) | SLACK_WEBHOOK_URL in GitHub Actions |
| Linear | Ticket management | LINEAR_API_KEY (MYC- prefix) |
| Sentry | Error monitoring | SENTRY_DSN, SENTRY_AUTH_TOKEN |
| SonarQube | Code quality | SONARQUBE_URL, SONARQUBE_TOKEN |
| Vercel | Web deployment | VERCEL_TOKEN |
| GitHub | CI/CD, PRs | GITHUB_TOKEN |
| Upstash Redis | Queue, sessions, cache | REDIS_URL |
| Neon | Database | DATABASE_URL |
| Clerk | Authentication | CLERK_SECRET_KEY |
| Stripe | Payments | STRIPE_SECRET_KEY |

## GitHub Actions Workflows
| Workflow | Trigger | Purpose |
|----------|---------|---------|
| claude.yml | @claude mention | Claude responds to issues/PRs (write perms) |
| claude-code-review.yml | PR open/sync | Auto code review (sonnet + haiku fallback) |
| linear-sync.yml | PR/review/CI events | Single source of truth for GitHub→Linear→Slack |
| ci.yml | PR + push to main | Lint + typecheck + tests + build |
| e2e.yml | PR + push to main | Playwright E2E (artifacts kept 3 days) |
| docker.yml | PR + push to main (path-filtered) | Test-build Docker images |
| security.yml | Push to main + weekly | python-security on push, CodeQL weekly only |

## Local Gates (pre-commit / pre-push)

Husky hooks in `.husky/` enforce these before code reaches GitHub. They replace the `dependency-audit` and `secrets-scan` jobs that used to live in `security.yml`.

**Pre-commit (`.husky/pre-commit`)**
- `gitleaks protect --staged` - blocks accidental secret commits. Install: `brew install gitleaks`. Backed by GitHub native Push Protection as a server-side fallback.

**Pre-push (`.husky/pre-push`)**
- `pnpm format:check && pnpm lint && pnpm type-check` - fast feedback before CI re-runs the same checks.
- `pnpm audit --audit-level=high` - catches CVEs in JS deps. Dependabot (`.github/dependabot.yml`) handles continuous updates.

Hooks install automatically via `"prepare": "husky"` in package.json. To bypass (NOT recommended): `git commit --no-verify` / `git push --no-verify`.

## Testing
- Bot tests: `python -m agents.scripts.test_pipeline_e2e` (44 tests)
- Action diagnostics: `python -m agents.scripts.test_claude_action`
- Web: Vitest + Playwright
- API: NestJS spec files

## Sibling Docs (read these instead of re-discovering)
- **AGENTS.md** - subagent dispatch + bot agents callable from chat + **Multi-Agent Task Protocol** (mandatory 6–10 parallel subagents for non-trivial tasks)
- **SKILLS.md** - trigger table mapping situations to skills + dev-loop commands

## Multi-Agent Task Protocol (summary; full rules in AGENTS.md)
For every non-trivial task, the main agent MUST:
1. Decompose into **6–10 legs** and spawn that many subagents **in parallel** (single message, multiple `Agent` tool calls).
2. Always include **one leg for internet research** when building/integrating/upgrading anything.
3. Subagents must NOT spawn their own subagents - fanout depth is exactly one.
4. Use the subagent type whose tools fit the leg (`general-purpose` for write/edit, `Explore` for read-only, `Plan` for design).
5. After subagents return, the main agent reads the actual diffs and runs the tests - does **not** delegate verification. Skip the protocol only for trivial single-file edits.

## MCP Routing Rules (when to use which integration)
| Situation | Use | Don't use |
|---|---|---|
| Tracking a task / referencing a ticket | Linear MCP (`MYC-` prefix) | inline comments, GitHub issues |
| Investigating a prod error or stack trace | Sentry MCP (`search_issues`, `analyze_issue_with_seer`) | grep through logs blindly |
| Checking deploy status / preview URL | Vercel MCP (`get_deployment`, `list_deployments`) | curl |
| Code quality / coverage / hotspots | SonarQube MCP - follow `.cursor/rules/sonarqube_mcp_instructions.mdc` (toggle automatic analysis off at start, re-enable + `analyze_file_list` at end) | guess project keys |
| PR / review / branch ops on this repo | GitHub MCP (`mcp__github__*`) | the `gh` CLI (not installed) |
| Posting an outage notice or release note | Slack MCP draft → confirm with user before send | direct send without review |

## Common-Task Runbook (intent → exact files)
| Intent | Files to touch (in order) |
|---|---|
| Add a new debate mode | `apps/agents/src/features/deliberation/deliberation_graph.py` (state machine) → `templates/registry.py` (prompt template) → `tests/deliberation/` (mode test) → `packages/shared/src/debates/debate-mode.ts` (TS enum) → `packages/cli/src/commands/debate.ts` (CLI flag) |
| Add a new model | `apps/agents/src/shared/config/models.py` MODEL_ALIASES + AVAILABLE_MODELS → `packages/shared/src/models/` → CLI default lists |
| New REST endpoint | `apps/api/src/features/<feature>/` (controller + service + dto) → `packages/shared/` types → `apps/web/lib/api/` client |
| New UI component | `apps/web/components/` → use shadcn/ui primitives, invoke `ui-ux-pro-max` skill |
| Touch BullMQ job | `apps/api/src/queue/` - retryStrategy must never return null; emit SSE `processing` only after worker accepts |
| Touch SSE event types | `packages/shared/src/sse/` first, then API + web simultaneously (single source of truth) |

## Plans & Specs (use existing structure, don't reinvent)
- For tasks touching > 3 files or making architectural changes, write a plan to `docs/superpowers/plans/YYYY-MM-DD-<slug>.md` **before** editing code.
- For design decisions (new system, schema change, API contract), write a spec to `docs/superpowers/specs/YYYY-MM-DD-<slug>.md`.
- Examples already in those dirs - follow that format. Skip for one-file fixes.

## Trust the local gates
The husky hooks below already run lint, typecheck, format, audit, and gitleaks. **Don't re-run them in shell to "verify"** unless you suspect a hook failed silently - CI will re-validate at the PR boundary anyway. This saves tokens and time.

# Consilium - AI Council Platform

## What This Is

Consilium is a multi-AI agent deliberation platform where models argue, critique, and synthesize consensus through structured debate. It implements 8 deliberation modes backed by peer-reviewed research (MIT multi-agent debate, ReConcile ACL 2024, Anthropic debate as oversight).

## Architecture

```
Web (Next.js 15) → API (NestJS 11/Fastify) → Agents (FastAPI/Python)
                                             ↓
                                    Deliberation Engine
                                    ├── Phase 1: Proposal (structured claims)
                                    ├── Phase 2: Challenge (cross-examination)
                                    ├── Phase 3: Rebuttal (concede/refute/qualify)
                                    ├── Phase 4: Evaluation (rubric scoring)
                                    ├── Phase 5: Voting (Condorcet/Ranked Pairs)
                                    ├── Phase 6: Convergence detection
                                    └── Phase 7: Synthesis (golden prompt + dissent)
```

### Systems

| System              | Path                 | Stack                                             |
| ------------------- | -------------------- | ------------------------------------------------- |
| Web App             | apps/web/            | Next.js 15, Clerk auth, Stripe, shadcn/ui         |
| API                 | apps/api/            | NestJS 11, Fastify, BullMQ, Prisma                |
| Deliberation Engine | apps/agents/         | FastAPI, 5 LLM providers, 13 deliberation modules |
| Bot/DevOps          | agents/              | Python, Slack bolt, Redis queue                   |
| CLI                 | packages/cli/        | TypeScript, Commander.js, SSE, 6 commands         |
| Python SDK          | packages/python-sdk/ | httpx, pydantic, async support                    |
| TypeScript SDK      | packages/sdk/        | fetch, ESM/CJS dual export                        |
| Database            | packages/database/   | Prisma, Neon PostgreSQL                           |
| Shared Types        | packages/shared/     | TypeScript                                        |

### Deliberation Modules (apps/agents/src/features/deliberation/)

| Module                | Purpose                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| deliberation_graph.py | State machine orchestrating all 8 modes                                      |
| argumentation.py      | Structured Claim/Challenge/Rebuttal prompts                                  |
| voting.py             | Condorcet, Borda, Ranked Pairs, Copeland                                     |
| convergence_v2.py     | Kendall tau + Jaccard + concession rate                                      |
| dissent.py            | Agglomerative clustering for minority positions                              |
| confidence.py         | Behavioral confidence via explanation stability                              |
| blind_eval.py         | Identity stripping + multi-ordering debiasing                                |
| cost_router.py        | Complexity-based mode routing                                                |
| red_team.py           | 8-category adversarial assessment                                            |
| truth_market.py       | Log-opinion-pool probabilistic consensus                                     |
| audit.py              | Per-call cost/latency/token tracking                                         |
| mcp_server.py         | 3 MCP tools for external integration                                         |
| templates/            | Vertical templates (code review, research, risk, healthcare, legal, finance) |

### Key Infrastructure

- **Redis**: Upstash (queue + sessions + cache)
- **DB**: Neon PostgreSQL via Prisma
- **Auth**: Clerk (web) + CLI tokens
- **Monitoring**: Sentry (consilium-pi org)
- **CI**: GitHub Actions (lint, typecheck, security, Claude Code review)

## Starting All Services

```bash
./run.sh
```

This single command checks prerequisites, installs deps, generates Prisma client, and starts web (:3000), API (:4000), and agents (:8000).

## Code Conventions

### Python (agents/, apps/agents/)

- No comments in code
- Direct imports over subprocess
- All models validated: only haiku/sonnet for bot, opus blocked
- Types in apps/agents/src/features/deliberation/types.py

### TypeScript (apps/web/, apps/api/, packages/)

- Shared types in packages/shared/
- Model IDs: use current registry names (claude-haiku-4-5-20251001, claude-sonnet-4-6, claude-opus-4-7, gpt-5.4, gpt-5.5, gemini-3-flash-preview, gemini-3.1-pro-preview, grok-4.20, kimi-k2.6). Legacy IDs are aliased but must not be hardcoded.
- BullMQ for async debate processing
- SSE for real-time streaming

## What NOT To Do

- Never push to GitHub directly
- Never use opus model in bot agents
- Never add "Co-Authored-By" or "Generated by Claude Code" to commits
- Never duplicate types that exist in packages/shared/
- Don't add comments to code unless asked

## Testing

- Python deliberation tests: `cd apps/agents && python -m pytest tests/deliberation/ --noconftest`
- TypeScript: `pnpm lint && pnpm typecheck`
- Bot tests: `python -m agents.scripts.test_pipeline_e2e`

## Session Docs

- **CLAUDE.md** (this file) - Architecture overview, conventions, start commands
- **AGENTS.md** - Dual agent system details (bot + deliberation engine)
- **PR-REVIEW.md** - Pull request standards and auto-review process
- **SKILLS.md** - Available skills, MCP servers, and system-specific guidelines

# Consilium Agents Architecture

## Two Agent Systems

### 1. Bot/DevOps Agents (agents/)
Operations automation running on DigitalOcean droplet.

```
agents/
├── bots/
│   ├── monitor_agent.py  — Polls Sentry and SonarQube; logs findings (no ticketing integrations)
│   └── briefing_agent.py — Text digest (Sentry, Vercel, SonarQube, db stats) to stdout
├── core/
│   ├── base.py           — Shared logging, optional Claude CLI helpers, monitor loop helper
│   ├── lanes.py          — Pipeline state machine types (lanes registry unused by monitor)
│   ├── recovery.py       — Failure-scenario recovery recipes (log-based escalation)
│   ├── telemetry.py      — Structured event recording (Redis + JSONL)
│   └── worker_registry.py — Worker lifecycle (7 states)
├── tools/                — CLI tool modules (sentry_api, sonarqube_api, vercel_api, db_lookup, etc.)
├── config.py             — Env vars for remaining integrations
└── run_all.py            — Orchestrator (monitor_agent; optional briefing)
```

### 2. Deliberation Engine (apps/agents/)
Multi-model structured deliberation with 8 modes and 13 core modules.

```
apps/agents/src/
├── core/
│   ├── orchestrator.py   — Legacy 3-round debate (being replaced by deliberation engine)
│   ├── agent_factory.py  — Multi-provider LLM routing (OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter) + free-tier fallback resolver
│   ├── circuit_breaker.py — Per-provider failure tracking
│   └── cost_tracker.py   — Per-model token/cost accounting
├── features/
│   ├── deliberation/     — NEW: Full deliberation engine
│   │   ├── deliberation_graph.py  — State machine: 13 phases, 8 modes
│   │   ├── argumentation.py       — Structured Claim/Challenge/Rebuttal JSON prompts
│   │   ├── voting.py              — Condorcet, Borda, Ranked Pairs, Copeland
│   │   ├── convergence_v2.py      — Kendall tau + Jaccard + concession rate (threshold 0.85)
│   │   ├── dissent.py             — Agglomerative clustering for minority positions
│   │   ├── confidence.py          — Behavioral calibration via explanation stability
│   │   ├── blind_eval.py          — Identity stripping + K=3 orderings + verbosity normalization
│   │   ├── cost_router.py         — Feature extraction → complexity score → mode routing
│   │   ├── red_team.py            — 8-category attack/defend/judge cycle
│   │   ├── truth_market.py        — Log-opinion-pool probabilistic consensus
│   │   ├── audit.py               — Per-call cost/latency/token tracking
│   │   ├── mcp_server.py          — FastMCP server (3 tools)
│   │   ├── types.py               — All shared dataclasses and enums
│   │   ├── router.py              — FastAPI endpoints for deliberation
│   │   ├── templates/             — Vertical templates (6 templates)
│   │   └── benchmarks/            — MMLU, TruthfulQA, HumanEval benchmark suite
│   ├── council/          — Council consensus synthesis
│   ├── debates/          — Debate creation + SSE streaming
│   └── streaming/        — Real-time event streaming
└── main.py               — FastAPI app with all routers
```

## 8 Deliberation Modes
| Mode | Flow | Rounds |
|------|------|--------|
| quick | PROPOSAL → EVALUATION → OUTPUT | 1 |
| council | PROPOSAL → CHALLENGE → REBUTTAL → EVALUATION → VOTING → AGGREGATION → CONVERGENCE → OUTPUT | 3 |
| deep | Same as council, higher convergence threshold | 5 |
| blind | Same as council + identity stripping | 3 |
| redteam | PROPOSAL → ATTACK → DEFEND → JUDGE_ATTACK → OUTPUT | 4 |
| jury | Same as council with panel judges | 3 |
| market | PROPOSAL → BET → MARKET_UPDATE → CONVERGENCE → OUTPUT | 5 |
| auto | Routes to appropriate mode via cost_router | varies |

## Model Rules
- Bot: haiku only, sonnet as fallback, opus BLOCKED
- Debate: any model the user's API keys support
- Judge: non-participant model required in blind mode
- Circuit breaker: provider unavailable for 60s after 3 failures
- Model registry: apps/agents/src/shared/config/models.py (includes aliases for dated IDs)

## Cursor Cloud specific instructions

### Services overview

| Service | Port | Dev command | Health check |
|---------|------|-------------|--------------|
| PostgreSQL | 5432 | `sudo docker compose up postgres redis -d` | `sudo docker compose ps` |
| Redis | 6379 | (started with postgres above) | (same) |
| NestJS API | 4000 | `pnpm --filter @consilium/api dev` | `curl http://localhost:4000/health` |
| Next.js Web | 3000 | `pnpm --filter @consilium/web dev` | `curl http://localhost:3000` |
| FastAPI Agents | 8000 | `poetry run uvicorn src.main:app --reload --port 8000` (from `apps/agents/`) | `curl http://localhost:8000/health` |

### Startup sequence

1. Start Docker daemon: `sudo dockerd &>/tmp/dockerd.log &` (wait ~5s)
2. Start containers: `sudo docker compose up postgres redis -d` (from repo root)
3. Generate Prisma client: `pnpm db:generate`
4. Push DB schema (first time only): `pnpm db:push`
5. Build shared types: `pnpm --filter @consilium/shared build` (required before API compiles)
6. Start API: `pnpm --filter @consilium/api dev`
7. Start Web: `pnpm --filter @consilium/web dev`
8. Start Agents: `cd apps/agents && poetry run uvicorn src.main:app --reload --port 8000`

### Gotchas

- The NestJS API requires `@swc/cli` and `@swc/core` as dev dependencies. Without them, `nest start --watch` fails immediately. They should already be in `apps/api/package.json`.
- `@consilium/shared` must be built (`pnpm --filter @consilium/shared build`) before the API can compile — it imports from `@consilium/shared/dist/`.
- The API global prefix is `api/v1` but health endpoints are excluded from it — health is at `/health`, not `/api/v1/health`.
- Swagger docs: API at `http://localhost:4000/api/docs`, Agents at `http://localhost:8000/docs`.
- Web returns HTTP 500 without a valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. The dev server still runs and compiles correctly.
- Agents report "degraded" health without LLM API keys — this is expected, not an error.
- Poetry must be on PATH: `export PATH="$HOME/.local/bin:$PATH"`.
- Both `.env` and `.env.local` at repo root are needed. The NestJS API reads `.env`/`.env.local` via `@nestjs/config`. The FastAPI agents' pydantic settings reads from `.env.local`. Next.js reads `.env.local`. Copy `.env.example` to both `.env` and `.env.local`.
- When starting FastAPI agents, source the env file first so `os.getenv()` calls in health checks work: `set -a && source /workspace/.env.local && set +a && poetry run uvicorn ...`.
- Do not quote values in `.env.local` — Next.js and pydantic-settings read the quotes literally.

### Lint / Test / Build

- **TS lint**: `pnpm lint` (0 errors, 32 warnings — all pre-existing)
- **Python lint**: `cd apps/agents && poetry run ruff check src/`
- **API tests**: `pnpm --filter @consilium/api test` (Jest — 70/79 pass; 9 failures need real Clerk/Resend keys)
- **Web tests**: `pnpm --filter @consilium/web test -- --run` (Vitest — 117/118 pass; 1 failure is pre-existing Clerk import in test env)
- **Agent tests**: `cd apps/agents && poetry run pytest tests/` (61/72 pass — pre-existing mock/assertion issues)
- **Type check**: `pnpm type-check`
- **Build all**: `pnpm build`

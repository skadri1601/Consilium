# Consilium Agents Architecture

> Sibling docs: **CLAUDE.md** (architecture, MCP routing, runbook), **SKILLS.md** (skill triggers, dev commands).

## Subagent Dispatch (which `Agent` to spawn)

| Need                                                                        | `subagent_type`              | Notes                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locate code: "where is X defined?", grep for symbols, find files by pattern | `Explore`                    | Read-only, fast. Specify breadth: `quick` / `medium` / `very thorough`. Don't use for review or cross-file analysis - it reads excerpts, not whole files. |
| Open-ended research, multi-step search across systems, ambiguous lookup     | `general-purpose`            | Has all tools. Use when you're not confident a single search will hit.                                                                                    |
| Design an implementation strategy before coding                             | `Plan`                       | Returns step-by-step plan + files to touch. Pair with `docs/superpowers/plans/`.                                                                          |
| Question about Claude Code, Agent SDK, or Anthropic API behavior            | `claude-code-guide`          | Use for "how does Claude Code do X" and SDK-shape questions.                                                                                              |
| Independent code review pass on changes                                     | code-reviewer (if available) | Doesn't see this conversation - give it the full context.                                                                                                 |

**Brief them like new colleagues**: state the goal, what's been ruled out, file paths + line numbers, and the desired output length. Terse command-style prompts produce shallow work.

## Multi-Agent Task Protocol (the default for substantive work)

For every new task that is **non-trivial** (anything beyond a single-line edit, typo, or one-file rename), the main agent MUST decompose the task and spawn **6–10 subagents in parallel**, then verify their work.

### Hard rules

1. **All subagents fan out from the main agent only.** Subagents must NOT spawn their own subagents - fanout depth is exactly one level.
2. **Spawn in a single message** with multiple `Agent` tool calls so the subagents run concurrently. Sequential `Agent` calls defeat the purpose.
3. **Pick the right subagent type per leg** - `Explore` for read-only lookup, `general-purpose` for legs that need to write/edit/run code, `Plan` for design legs, `claude-code-guide` for SDK/API questions. Each subagent gets the tool set of its type; route legs that need write access to `general-purpose`.
4. **One leg is always internet research** when the task involves building, integrating, or upgrading something - that subagent returns external context (docs, gotchas, recent best practices) so the main agent isn't guessing from training data.
5. **Main agent does NOT delegate verification.** After subagents return, the main agent reads the actual diffs/files (not just the agents' summaries) and runs the relevant tests itself before claiming done. Subagent summaries describe intent, not outcome.

### Standard 6–10 leg decomposition (template)

| #   | Leg                                                       | Typical subagent  |
| --- | --------------------------------------------------------- | ----------------- |
| 1   | Map the relevant code surface (files, functions, callers) | `Explore`         |
| 2   | Internet research on the library/spec/best practices      | `general-purpose` |
| 3   | Existing-tests audit (what tests cover this area today)   | `Explore`         |
| 4   | Implementation plan / file-edit list                      | `Plan`            |
| 5   | Implement the primary change                              | `general-purpose` |
| 6   | Implement the secondary change / wire-up                  | `general-purpose` |
| 7   | Add/extend tests                                          | `general-purpose` |
| 8   | Update types in `packages/shared/` if needed              | `general-purpose` |
| 9   | Cross-system check (web/api/agents alignment)             | `Explore`         |
| 10  | Docs / runbook entries                                    | `general-purpose` |

Drop legs that don't apply; aim for **6 minimum** when the task touches ≥ 2 systems or ≥ 3 files. For trivial single-file edits, skip this protocol and edit directly.

### Verification phase (main agent only)

After all subagents return:

1. Read the actual edited files (not the summaries).
2. Run the relevant test commands from SKILLS.md (per-package `pnpm type-check`, deliberation tests, etc.).
3. Reconcile contradictions between subagent reports.
4. Only then mark the task done.

## Bot Agents as Runnable Tools (chat-callable)

The bot daemon in `agents/` is normally long-running on the droplet, but each bot also runs as a one-shot. Use these from chat when the user asks "what's broken in prod?" or "give me a status digest":

| User intent                         | Command                                       | Output                                                      |
| ----------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| "What's failing in prod right now?" | `python -m agents.bots.monitor_agent --once`  | Logs unresolved Sentry issues + SonarQube gate state        |
| "Give me a project status briefing" | `python -m agents.bots.briefing_agent`        | Text digest (Sentry, Vercel, SonarQube, DB stats) to stdout |
| "Is the bot pipeline healthy?"      | `python -m agents.scripts.test_pipeline_e2e`  | Runs 44 pipeline tests                                      |
| "Check the Claude Action wiring"    | `python -m agents.scripts.test_claude_action` | Action-side diagnostics                                     |

Prefer these over hand-grepping logs or manually pulling from MCP. Pipe stdout into context only when the user asked for the digest - they're chatty.

## Two Agent Systems

### 1. Bot/DevOps Agents (agents/)

Operations automation running on DigitalOcean droplet.

```
agents/
├── bots/
│   ├── monitor_agent.py  - Polls Sentry and SonarQube; logs findings (no ticketing integrations)
│   └── briefing_agent.py - Text digest (Sentry, Vercel, SonarQube, db stats) to stdout
├── core/
│   ├── base.py           - Shared logging, optional Claude CLI helpers, monitor loop helper
│   ├── lanes.py          - Pipeline state machine types (lanes registry unused by monitor)
│   ├── recovery.py       - Failure-scenario recovery recipes (log-based escalation)
│   ├── telemetry.py      - Structured event recording (Redis + JSONL)
│   └── worker_registry.py - Worker lifecycle (7 states)
├── tools/                - CLI tool modules (sentry_api, sonarqube_api, vercel_api, db_lookup, etc.)
├── config.py             - Env vars for remaining integrations
└── run_all.py            - Orchestrator (monitor_agent; optional briefing)
```

### 2. Deliberation Engine (apps/agents/)

Multi-model structured deliberation with 8 modes and 13 core modules.

```
apps/agents/src/
├── core/
│   ├── orchestrator.py   - Legacy 3-round debate (being replaced by deliberation engine)
│   ├── agent_factory.py  - Multi-provider LLM routing (OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter) + free-tier fallback resolver
│   ├── circuit_breaker.py - Per-provider failure tracking
│   └── cost_tracker.py   - Per-model token/cost accounting
├── features/
│   ├── deliberation/     - NEW: Full deliberation engine
│   │   ├── deliberation_graph.py  - State machine: 13 phases, 8 modes
│   │   ├── argumentation.py       - Structured Claim/Challenge/Rebuttal JSON prompts
│   │   ├── voting.py              - Condorcet, Borda, Ranked Pairs, Copeland
│   │   ├── convergence_v2.py      - Kendall tau + Jaccard + concession rate (threshold 0.85)
│   │   ├── dissent.py             - Agglomerative clustering for minority positions
│   │   ├── confidence.py          - Behavioral calibration via explanation stability
│   │   ├── blind_eval.py          - Identity stripping + K=3 orderings + verbosity normalization
│   │   ├── cost_router.py         - Feature extraction → complexity score → mode routing
│   │   ├── red_team.py            - 8-category attack/defend/judge cycle
│   │   ├── truth_market.py        - Log-opinion-pool probabilistic consensus
│   │   ├── audit.py               - Per-call cost/latency/token tracking
│   │   ├── mcp_server.py          - FastMCP server (3 tools)
│   │   ├── types.py               - All shared dataclasses and enums
│   │   ├── router.py              - FastAPI endpoints for deliberation
│   │   ├── templates/             - Vertical templates (6 templates)
│   │   └── benchmarks/            - MMLU, TruthfulQA, HumanEval benchmark suite
│   ├── council/          - Council consensus synthesis
│   ├── debates/          - Debate creation + SSE streaming
│   └── streaming/        - Real-time event streaming
└── main.py               - FastAPI app with all routers
```

## 8 Deliberation Modes

| Mode    | Flow                                                                                       | Rounds |
| ------- | ------------------------------------------------------------------------------------------ | ------ |
| quick   | PROPOSAL → EVALUATION → OUTPUT                                                             | 1      |
| council | PROPOSAL → CHALLENGE → REBUTTAL → EVALUATION → VOTING → AGGREGATION → CONVERGENCE → OUTPUT | 3      |
| deep    | Same as council, higher convergence threshold                                              | 5      |
| blind   | Same as council + identity stripping                                                       | 3      |
| redteam | PROPOSAL → ATTACK → DEFEND → JUDGE_ATTACK → OUTPUT                                         | 4      |
| jury    | Same as council with panel judges                                                          | 3      |
| market  | PROPOSAL → BET → MARKET_UPDATE → CONVERGENCE → OUTPUT                                      | 5      |
| auto    | Routes to appropriate mode via cost_router                                                 | varies |

## Model Rules

- Bot: haiku only, sonnet as fallback, opus BLOCKED
- Debate: any model the user's API keys support
- Judge: non-participant model required in blind mode
- Circuit breaker: provider unavailable for 60s after 3 failures
- Model registry: apps/agents/src/shared/config/models.py (includes aliases for dated IDs)

## Cursor Cloud specific instructions

### Services overview

| Service        | Port | Dev command                                                                  | Health check                        |
| -------------- | ---- | ---------------------------------------------------------------------------- | ----------------------------------- |
| PostgreSQL     | 5432 | `sudo docker compose up postgres redis -d`                                   | `sudo docker compose ps`            |
| Redis          | 6379 | (started with postgres above)                                                | (same)                              |
| NestJS API     | 4000 | `pnpm --filter @consilium/api dev`                                           | `curl http://localhost:4000/health` |
| Next.js Web    | 3000 | `pnpm --filter @consilium/web dev`                                           | `curl http://localhost:3000`        |
| FastAPI Agents | 8000 | `uv run uvicorn src.main:app --reload --port 8000` (from `apps/agents/`)  | `curl http://localhost:8000/health` |

### Startup sequence

1. Start Docker daemon: `sudo dockerd &>/tmp/dockerd.log &` (wait ~5s)
2. Start containers: `sudo docker compose up postgres redis -d` (from repo root)
3. Generate Prisma client: `pnpm db:generate`
4. Push DB schema (first time only): `pnpm db:push`
5. Build shared types: `pnpm --filter @consilium/shared build` (required before API compiles)
6. Start API: `pnpm --filter @consilium/api dev`
7. Start Web: `pnpm --filter @consilium/web dev`
8. Start Agents: `cd apps/agents && uv run uvicorn src.main:app --reload --port 8000`

### Gotchas

- The NestJS API requires `@swc/core` as a dev dependency. Without it, `nest start --watch` fails immediately. It should already be in `apps/api/package.json`.
- `@consilium/shared` must be built (`pnpm --filter @consilium/shared build`) before the API can compile - it imports from `@consilium/shared/dist/`.
- The API global prefix is `api/v1` but health endpoints are excluded from it - health is at `/health`, not `/api/v1/health`.
- Swagger docs: API at `http://localhost:4000/api/docs`, Agents at `http://localhost:8000/docs`.
- Web returns HTTP 500 without a valid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. The dev server still runs and compiles correctly.
- Agents report "degraded" health without LLM API keys - this is expected, not an error.
- uv must be on PATH (install via `curl -LsSf https://astral.sh/uv/install.sh | sh` or `pip install uv`).
- Both `.env` and `.env.local` at repo root are needed. The NestJS API reads `.env`/`.env.local` via `@nestjs/config`. The FastAPI agents' pydantic settings reads from `.env.local`. Next.js reads `.env.local`. Copy `.env.example` to both `.env` and `.env.local`.
- When starting FastAPI agents, source the env file first so `os.getenv()` calls in health checks work: `set -a && source /workspace/.env.local && set +a && uv run uvicorn ...`.
- Do not quote values in `.env.local` - Next.js and pydantic-settings read the quotes literally.

### Lint / Test / Build

- **TS lint**: `pnpm lint` (0 errors, 12 warnings - all pre-existing)
- **Python lint**: `cd apps/agents && uv run ruff check src/`
- **API tests**: `pnpm --filter @consilium/api test` (Jest - 76 pass)
- **Web tests**: `pnpm --filter @consilium/web test -- --run` (Vitest - 118 pass)
- **Agent tests**: `cd apps/agents && uv run pytest tests/` (pre-existing mock/assertion issues expected without LLM keys)
- **Type check**: `pnpm type-check`
- **Build all**: `pnpm build`

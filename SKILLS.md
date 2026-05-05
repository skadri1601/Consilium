# Claude Code Skills & Capabilities for Consilium

> Sibling docs: **CLAUDE.md** (architecture, MCP routing, runbook), **AGENTS.md** (subagent dispatch, bot agents).

## Skill Trigger Table — invoke automatically when the situation matches

| Trigger / situation | Skill |
|---|---|
| User says "review this PR" / before merging | `review` |
| New auth, secrets, encryption, or RBAC code | `security-review` |
| Adding or tuning Anthropic SDK / Claude API code (caching, thinking, tool use) | `claude-api` |
| A bug, test failure, or unexpected behavior | `systematic-debugging` |
| About to claim a task is done | `verification-before-completion` |
| Designing or modifying REST endpoints | `api-design-principles` |
| Implementing a new feature with non-trivial logic | `test-driven-development` |
| UI/styling work in `apps/web/` | `ui-ux-pro-max` |
| Reviewing changed code for reuse / quality / efficiency | `simplify` |
| Permissions prompts feel noisy | `fewer-permission-prompts` |
| Setting up a recurring task (every N min) | `loop` |
| First time bootstrapping this repo for Claude Code on the web | `session-start-hook` |
| Settings.json / hooks / env vars / permission changes | `update-config` |
| Customizing keyboard shortcuts | `keybindings-help` |

If a skill exists for the situation, invoke it **before** writing other text. Only use names from the available-skills list — never guess.

## Subagent Dispatch (cross-ref AGENTS.md for full rules)

| Need | Subagent |
|---|---|
| "Where is X defined?" / find files | `Explore` |
| Open-ended multi-step research | `general-purpose` |
| Design an implementation strategy | `Plan` |
| Question about Claude Code / SDK / API | `claude-code-guide` |

## Starting Services

```bash
./run.sh    # Web :3000, API :4000, Agents :8000
```

## Dev-Loop Commands (use the smallest scope that proves the change)

| Goal | Command |
|---|---|
| Type-check just web | `pnpm --filter @consilium/web type-check` |
| Type-check just api | `pnpm --filter @consilium/api type-check` |
| Lint changed files only | `pnpm lint` (turbo caches per-package) |
| Run agents tests | `cd apps/agents && poetry run pytest tests/deliberation/ -x` |
| 137 deliberation tests | `cd apps/agents && python -m pytest tests/deliberation/ --noconftest` |
| Generate Prisma client | `pnpm db:generate` |
| Sync `.env.local` → `.env` | `pnpm env:sync` |

## CLI

```bash
consilium debate "topic" --mode council
consilium debate "topic" --mode redteam
consilium debate "topic" --mode blind
consilium benchmark --benchmark mmlu --models claude-sonnet-4-6,gpt-5.4 --n 10
consilium redteam "content to assess"
consilium eval "topic" --responses file.json
```

## Benchmarks

```bash
cd apps/agents
python -m src.features.deliberation.benchmarks.runner \
  --benchmark mmlu --models claude-sonnet-4-6,gpt-5.4 --mode council --n 50
```

## Database

```bash
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Prisma Studio
```

## Docker (self-host)

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

## When Working On Each System

### apps/agents/ (Deliberation Engine)
- All types in `deliberation/types.py` — never duplicate
- `DeliberationEngine` in `deliberation_graph.py` is the main orchestrator
- Model IDs must be in `shared/config/models.py` MODEL_ALIASES or AVAILABLE_MODELS
- Cost tracking: `_estimate_cost()` in `deliberation_graph.py`
- Templates in `deliberation/templates/` follow the registry.py pattern

### apps/api/ (NestJS)
- Types from `packages/shared/` — never duplicate
- Deliberation endpoints in `features/deliberation/`
- SSE streaming via `deliberation-sse.service.ts`
- BullMQ retryStrategy must never return null

### packages/cli/
- Commands in `src/commands/` (debate, eval, redteam, benchmark)
- Judge config in `src/utils/cli-judge.ts` — mode-specific via `getJudgeConfig()`
- Decision extraction in `src/utils/decision-extractor.ts` — LLM semantic + regex fallback
- SSE uses `onmessage` (not `addEventListener`)

### packages/shared/
- Single source of truth for: model IDs, debate modes, SSE events, status types
- If adding a model, add it HERE first

### packages/sdk/ and packages/python-sdk/
- TypeScript SDK: ESM + CJS dual export, native fetch
- Python SDK: httpx + pydantic, sync + async clients

## Key Files to Read First
1. **CLAUDE.md** — Architecture, MCP routing, common-task runbook
2. **AGENTS.md** — Dual agent system + subagent dispatch
3. **SKILLS.md** (this file) — Skill triggers + commands
4. `apps/agents/src/features/deliberation/types.py` — All deliberation types
5. `packages/shared/src/debates/debate-mode.ts` — Mode definitions

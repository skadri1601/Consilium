# Claude Code Skills & Capabilities for Consilium

## Starting Services

```bash
./run.sh    # Starts ALL services (web :3000, API :4000, agents :8000)
```

## Available Skills to Call
- **ui-ux-pro-max** - UI/UX design for apps/web/ (67 styles, 96 palettes, shadcn/ui)
- **systematic-debugging** - For any bug, test failure, or unexpected behavior
- **test-driven-development** - Before implementing features
- **verification-before-completion** - Before claiming work is done
- **requesting-code-review** - Before merging PRs
- **api-design-principles** - When designing/modifying REST endpoints

## MCP Servers Available
- **Linear** - Ticket management (MYC- prefix), use for project tracking
- **Sentry** - Error monitoring, use when debugging production issues
- **Vercel** - Web deployment status and logs

## Project-Specific Commands

### All Services
```bash
./run.sh                    # Start everything
```

### Testing
```bash
cd apps/agents && python -m pytest tests/deliberation/ --noconftest   # 137 deliberation tests
pnpm lint                   # Lint all TypeScript
pnpm typecheck              # Type check all TypeScript
```

### CLI
```bash
consilium debate "topic" --mode council
consilium debate "topic" --mode redteam
consilium debate "topic" --mode blind
consilium benchmark --benchmark mmlu --models claude-sonnet-4-6,gpt-5.4 --n 10
consilium redteam "content to assess"
consilium eval "topic" --responses file.json
```

### Benchmarks
```bash
cd apps/agents
python -m src.features.deliberation.benchmarks.runner --benchmark mmlu --models claude-sonnet-4-6,gpt-5.4 --mode council --n 50
```

### Database
```bash
pnpm db:generate            # Generate Prisma client
pnpm db:migrate             # Run migrations
pnpm db:studio              # Open Prisma Studio
```

### Docker
```bash
docker compose -f docker-compose.selfhost.yml up -d
```

## When Working On Each System

### apps/agents/ (Deliberation Engine)
- All types in deliberation/types.py - never duplicate
- DeliberationEngine in deliberation_graph.py is the main orchestrator
- Model IDs must be in shared/config/models.py MODEL_ALIASES or AVAILABLE_MODELS
- Cost tracking: _estimate_cost() in deliberation_graph.py calculates per-model costs
- Templates in deliberation/templates/ follow a standard pattern (read registry.py)

### apps/api/ (NestJS)
- Types from packages/shared/ - never duplicate
- Deliberation endpoints in features/deliberation/
- SSE streaming via deliberation-sse.service.ts
- BullMQ retryStrategy must never return null

### packages/cli/
- Commands in src/commands/ (debate, eval, redteam, benchmark)
- Judge config in src/utils/cli-judge.ts - mode-specific via getJudgeConfig()
- Decision extraction in src/utils/decision-extractor.ts - LLM semantic + regex fallback
- SSE uses onmessage (not addEventListener)

### packages/shared/
- Single source of truth for: model IDs, debate modes, SSE events, status types
- If adding a model, add it HERE first

### packages/sdk/ and packages/python-sdk/
- TypeScript SDK: ESM + CJS dual export, native fetch
- Python SDK: httpx + pydantic, sync + async clients

## Key Files to Read First
1. **CLAUDE.md** - Architecture overview, conventions
2. **AGENTS.md** - Dual agent system details
3. **PR-REVIEW.md** - Pull request standards
4. **SKILLS.md** (this file) - Commands, skills, system guidelines
5. **apps/agents/src/features/deliberation/types.py** - All deliberation types
6. **packages/shared/src/debates/debate-mode.ts** - Mode definitions

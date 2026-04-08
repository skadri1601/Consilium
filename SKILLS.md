# Claude Code Skills & Capabilities for Consilium

## Available Skills

### ui-ux-pro-max
UI/UX design intelligence with 67 styles, 96 palettes, 57 font pairings, 25 chart types across 13 tech stacks. Use for any frontend work on apps/web/.

## Project-Specific Commands

### Bot Development
```bash
# Run bot locally
source agents/.venv/Scripts/activate
PYTHONPATH=. python -m agents.bots.slack_bot --model haiku

# Run monitor
PYTHONPATH=. python -m agents.bots.monitor_agent --interval 300 --once

# Run all agents
PYTHONPATH=. python -m agents.run_all

# Run tests
python -m agents.scripts.test_pipeline_e2e

# Check model/API access
python -m agents.scripts.test_claude_action
```

### Web Development
```bash
pnpm install
pnpm dev          # starts web on :3000
pnpm typecheck    # type check all packages
pnpm lint         # lint all packages
```

### API Development
```bash
cd apps/api
pnpm start:dev    # starts API on :4000
pnpm db:migrate   # run Prisma migrations
pnpm db:studio    # open Prisma Studio
```

### CLI Development
```bash
cd packages/cli
pnpm dev debate "topic" --mode council
pnpm dev chat
```

### Debate Engine
```bash
cd apps/agents
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

## When Working On Each System

### agents/ (Bot Layer)
- Always run test_pipeline_e2e after changes
- Model validation: only haiku/sonnet
- External calls: wrap in recovery engine
- Redis: always handle ConnectionError
- Sessions: auto-compact at 15 entries
- Workers: 3 threads, track lifecycle via WorkerRegistry

### apps/agents/ (Debate Engine)
- Use shared.py for constants (FALLBACK_RESPONSE, _sse, _now_iso)
- Circuit breaker checks before LLM calls
- Judge _call_model has retry+timeout — don't add more
- base_agent.py: pass system_prompt as parameter, don't monkey-patch
- Sentry: send_default_pii=False (don't leak PII)

### apps/api/ (NestJS)
- Types come from packages/shared/ — never duplicate
- BullMQ retryStrategy must never return null
- SSE endpoints need keepalive heartbeat
- debates.service: use _prepareDebate() for shared setup
- findAll excludes deleted/cancelled by default

### packages/cli/
- Model IDs match packages/shared/src/providers/models.ts
- cancelDebate uses POST (not DELETE)
- SIGINT handler for graceful debate cancellation
- SSE uses onmessage (not addEventListener) — NestJS sends unnamed events

### packages/shared/
- Single source of truth for: model IDs, pricing, debate modes, SSE events, status types
- If you add a model, add it HERE first, then consumers import

## Deployment

### Droplet (bot agents)
```bash
ssh root@droplet
cd /opt/consilium-bot/repo
git pull origin feature/Consilium_bot
pip install -r agents/requirements.txt
systemctl restart consilium-bot
```

### Vercel (web)
Auto-deploys on push to main via vercel.json.

### Render (API)
Auto-deploys on push to main.

## Key Files to Read First
1. CLAUDE.md — architecture overview
2. AGENTS.md — agent system details
3. PR-REVIEW.md — PR standards
4. agents/config.py — all env vars
5. packages/shared/src/ — canonical types

# Consilium Agents Architecture

## Two Agent Systems

### 1. Bot/DevOps Agents (agents/)
Operations automation running on DigitalOcean droplet.

```
agents/
├── bots/
│   ├── slack_bot.py      — 3 Redis workers, intent routing, streaming responses
│   ├── monitor_agent.py  — Sentry/SonarQube/email monitoring with recovery
│   └── briefing_agent.py — Daily status reports
├── core/
│   ├── base.py           — Claude CLI tool-use loop (15 turns max, 13 tools)
│   ├── router.py         — Intent detection (17 patterns) + quick command handlers
│   ├── redis_queue.py    — Task queue (Upstash Redis, SQLite fallback)
│   ├── redis_session.py  — Session storage (24h TTL, auto-compaction at 15 entries)
│   ├── lanes.py          — Pipeline state machine (error → ticket → PR → merge → verify)
│   ├── recovery.py       — 10 failure scenarios with multi-step recipes + escalation
│   ├── telemetry.py      — Structured event recording (Redis + JSONL)
│   ├── hooks.py          — Pre/post tool execution hooks
│   ├── worker_registry.py — Worker lifecycle (7 states: IDLE→CLAIMING→PROCESSING→...)
│   ├── task_packet.py    — Structured task specs with acceptance criteria
│   └── tool_registry.py  — @tool decorator, auto-schema, permission levels
├── tools/                — CLI tool modules (linear_api, sentry_api, email_imap, etc.)
├── config.py             — All env vars, model validation
└── run_all.py            — Orchestrator (slack_bot + monitor_agent)
```

### 2. Debate Engine (apps/agents/)
Multi-model AI debate orchestration.

```
apps/agents/src/
├── core/
│   ├── orchestrator.py   — 3-round debate with convergence detection
│   ├── judge.py          — 5-phase synthesis (claims → cross-ref → disputes → scoring → synthesis)
│   ├── shared.py         — Constants (FALLBACK_RESPONSE, _sse, _now_iso)
│   ├── circuit_breaker.py — Per-provider failure tracking (async-safe)
│   ├── convergence.py    — Cosine similarity via OpenAI embeddings
│   ├── cost_tracker.py   — Per-model token/cost accounting
│   └── anonymizer.py     — Blind mode response anonymization
├── features/
│   ├── agents/           — 5 LLM providers (OpenAI, Anthropic, Google, Groq, xAI)
│   ├── council/          — Council consensus synthesis
│   ├── debates/          — Debate creation + SSE streaming
│   └── streaming/        — Real-time event streaming
└── main.py               — FastAPI app with Sentry + request timing
```

## Key Patterns

### Recovery (agents/core/recovery.py)
Every external API call is wrapped in recovery context:
```python
with recovery_engine.with_recovery(FailureScenario.SENTRY_UNREACHABLE):
    check_sentry(state)
```
10 scenarios, each with multi-step recipes and escalation policies.

### Lanes (agents/core/lanes.py)
Pipeline tracking from error detection through resolution:
STARTED → TICKET_CREATED → BRANCH_CREATED → PR_OPENED → CI_GREEN → MERGED → VERIFIED → CLOSED

### Worker Lifecycle (agents/core/worker_registry.py)
IDLE → CLAIMING → PROCESSING → STREAMING → COMPLETING → (back to IDLE or FAILED)

### Tool Execution
- Bot layer: subprocess for safety (router), direct imports for speed (monitor)
- Debate engine: direct async calls to LLM providers

### Session Compaction
Sessions auto-compact when history exceeds 15 entries. Older exchanges get summarized, recent 5 preserved verbatim.

## Model Rules
- Bot: haiku only, sonnet as fallback, opus BLOCKED
- Debate: any model the user's API keys support
- Judge: strong model (sonnet/gpt-4o) for synthesis, cheap model (haiku/gpt-4o-mini) for analysis phases
- Circuit breaker: if a provider fails 3x, it's marked unavailable for 60s

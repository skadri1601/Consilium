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
│   └── worker_registry.py — Worker lifecycle (7 states)
├── tools/                — CLI tool modules (linear_api, sentry_api, email_imap, etc.)
├── config.py             — All env vars, model validation
└── run_all.py            — Orchestrator (slack_bot + monitor_agent)
```

### 2. Deliberation Engine (apps/agents/)
Multi-model structured deliberation with 8 modes and 13 core modules.

```
apps/agents/src/
├── core/
│   ├── orchestrator.py   — Legacy 3-round debate (being replaced by deliberation engine)
│   ├── agent_factory.py  — Multi-provider LLM routing (OpenAI, Anthropic, Google, Groq, xAI)
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

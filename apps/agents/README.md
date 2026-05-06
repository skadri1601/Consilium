# Consilium Agents

Multi-agent LLM orchestration workers for the Consilium AI Council platform.

## Overview

This service orchestrates debates between multiple AI models using LangGraph. It handles:
- Multi-agent debate workflows
- Real-time streaming responses via SSE
- Integration with 7 LLM providers: OpenAI, Anthropic, Google, Groq, xAI, Moonshot (Kimi), and OpenRouter
- BYOK-first with platform free-tier fallback (CONSILIUM_FREE_TIER_GROQ_KEY / CONSILIUM_FREE_TIER_OPENROUTER_KEY)
- Consensus generation (Golden Prompt synthesis)

## Tech Stack

- **Framework**: FastAPI + Uvicorn
- **Orchestration**: LangGraph
- **LLM Integration**: LangChain
- **Database**: PostgreSQL (via asyncpg)
- **Cache**: Redis
- **Observability**: Langfuse, Sentry, OpenTelemetry

## Development

```bash
# Install dependencies
poetry install

# Run locally
poetry run uvicorn src.main:app --reload --port 8000

# Run tests
poetry run pytest

# Lint and format
poetry run ruff check .
poetry run black .
poetry run mypy .
```

## Environment Variables

Create a `.env` file:

```env
# API Keys (BYOK - Bring Your Own Keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=gsk_...
XAI_API_KEY=xai-...
MOONSHOT_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...

# Free-tier fallback pool (used only when a debate has no BYOK
# for the requested provider - BYOK always takes precedence)
CONSILIUM_FREE_TIER_GROQ_KEY=gsk_...
CONSILIUM_FREE_TIER_OPENROUTER_KEY=sk-or-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/consilium

# Redis
REDIS_URL=redis://localhost:6379

# Observability (optional)
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...
SENTRY_DSN=...
```

## Docker

```bash
# Build
docker build -f apps/agents/Dockerfile -t consilium-agents .

# Run
docker run -p 8000:8000 --env-file .env consilium-agents
```

## API Endpoints

- `POST /api/v1/debates` - Create a new debate
- `GET /api/v1/debates/{id}/stream` - Stream debate results (SSE)
- `GET /health` - Health check

## Architecture

```
┌─────────────────────────────────────────┐
│           FastAPI Service               │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │      LangGraph Workflow          │   │
│  │  ┌────────┐  ┌────────┐         │   │
│  │  │ Agent  │  │ Agent  │  ...    │   │
│  │  │  GPT   │  │Claude  │         │   │
│  │  └────────┘  └────────┘         │   │
│  │       │            │             │   │
│  │       └────────────┘             │   │
│  │            │                     │   │
│  │      ┌──────────┐                │   │
│  │      │Consensus │                │   │
│  │      │Generator │                │   │
│  │      └──────────┘                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Database (Postgres) ←→ Cache (Redis)  │
└─────────────────────────────────────────┘
```

## License

Proprietary - © Consilium. All rights reserved. The Consilium source repository is private as of April 2026. See [LICENSE](../../LICENSE) for permitted use.

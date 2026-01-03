# Consilium AI Workers

> Python FastAPI application with LangGraph for multi-agent LLM orchestration.

## Overview

The Consilium AI Workers service handles all AI model interactions, multi-agent orchestration, and consensus generation. Built with FastAPI and LangGraph, it provides real-time streaming responses and coordinates between GPT-4, Claude, Gemini, and other LLMs.

**Hosted on Railway** alongside the NestJS backend.

## Key Features

- **Multi-Agent Orchestration**: Coordinate responses from multiple LLMs
- **LangGraph Workflows**: Complex multi-step agent workflows
- **Streaming Responses**: Server-Sent Events for real-time token streaming
- **Consensus Generation**: Synthesize insights from multiple agents
- **Semantic Caching**: Redis-based caching for repeated queries
- **Provider Abstraction**: Unified interface for OpenAI, Anthropic, Google

## Tech Stack

- **Framework**: FastAPI
- **Language**: Python 3.11+
- **Agent Framework**: LangGraph
- **LLM Providers**: OpenAI, Anthropic, Google AI
- **Cache**: Upstash Redis
- **Validation**: Pydantic
- **Async**: asyncio + httpx
- **Testing**: pytest + pytest-asyncio

## Project Structure

The AI workers use a **feature-based architecture** where each feature contains all its related files.

```
apps/agents/
├── src/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry
│   │
│   ├── features/                  # Feature modules
│   │   ├── __init__.py
│   │   │
│   │   ├── council/              # Council orchestration
│   │   │   ├── __init__.py
│   │   │   ├── router.py         # FastAPI routes
│   │   │   ├── service.py        # Business logic
│   │   │   ├── schema.py         # Pydantic schemas
│   │   │   └── council_agent.py  # Consensus agent
│   │   │
│   │   ├── agents/               # LLM agent implementations
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── base_agent.py     # Abstract base class
│   │   │   ├── openai_agent.py   # GPT-4 implementation
│   │   │   ├── anthropic_agent.py # Claude implementation
│   │   │   └── google_agent.py   # Gemini implementation
│   │   │
│   │   ├── streaming/            # SSE streaming
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   └── service.py
│   │   │
│   │   └── health/               # Health checks
│   │       ├── __init__.py
│   │       └── router.py
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── __init__.py
│   │   ├── config/
│   │   │   ├── __init__.py
│   │   │   └── settings.py       # Pydantic settings
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── redis.py          # Upstash Redis client
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── helpers.py        # Cost calculation, etc.
│   │   └── types/
│   │       ├── __init__.py
│   │       └── common.py         # Enums and base types
│   │
│   └── workflows/                # LangGraph workflows
│       ├── __init__.py
│       ├── multi_agent.py        # Multi-agent orchestration
│       └── consensus.py          # Consensus generation
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # Pytest fixtures
│   └── features/
│       ├── council/
│       │   └── test_council.py
│       └── agents/
│           └── test_agents.py
│
├── pyproject.toml                # Poetry dependencies
├── poetry.lock
└── README.md
```

## Getting Started

### Prerequisites

```bash
python >= 3.11
poetry >= 1.7
```

### Installation

```bash
# Navigate to agents directory
cd apps/agents

# Install dependencies with Poetry
poetry install

# Or with pip
pip install -e .
```

### Environment Variables

Create `apps/agents/.env`:

```bash
# Application
APP_ENV=development
DEBUG=true
HOST=0.0.0.0
PORT=8000

# LLM Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Redis (Upstash)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# Backend API (for callbacks)
BACKEND_API_URL=http://localhost:3001

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

### Development

```bash
# Start development server
poetry run uvicorn src.main:app --reload --port 8000

# Or using the main entry point
poetry run python -m src.main

# Type checking
poetry run mypy src/

# Linting
poetry run ruff check src/

# Format code
poetry run ruff format src/
```

Server runs on [http://localhost:8000](http://localhost:8000)

API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## API Endpoints

### Council

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/council/query` | Submit query to multiple agents |
| POST | `/api/v1/council/query/stream` | Stream responses from agents |
| GET | `/api/v1/council/agents` | List available agents |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/agents/` | List all agents |
| GET | `/api/v1/agents/{id}` | Get agent details |
| POST | `/api/v1/agents/query` | Query single agent |
| GET | `/api/v1/agents/{id}/health` | Check agent health |

### Streaming

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/stream/council` | Stream multi-agent responses |
| POST | `/api/v1/stream/agent/{id}` | Stream single agent response |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/ready` | Readiness check |
| GET | `/live` | Liveness check |

## Code Examples

### Feature Router

```python
# features/council/router.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from .service import CouncilService
from .schema import CouncilQuery, CouncilResponse

router = APIRouter(prefix="/council", tags=["council"])

def get_council_service() -> CouncilService:
    return CouncilService()

@router.post("/query", response_model=CouncilResponse)
async def query_council(
    query: CouncilQuery,
    service: CouncilService = Depends(get_council_service)
):
    """Submit a query to the AI council."""
    return await service.process_query(query)

@router.post("/query/stream")
async def query_council_stream(
    query: CouncilQuery,
    service: CouncilService = Depends(get_council_service)
):
    """Stream responses from the AI council."""
    return StreamingResponse(
        service.process_query_stream(query),
        media_type="text/event-stream"
    )
```

### Feature Service

```python
# features/council/service.py
import asyncio
from typing import AsyncGenerator, List
from .schema import CouncilQuery, CouncilResponse, AgentResponse
from ..agents import OpenAIAgent, AnthropicAgent, GoogleAgent

class CouncilService:
    def __init__(self):
        self.agents = {
            "gpt-4": OpenAIAgent(),
            "claude": AnthropicAgent(),
            "gemini": GoogleAgent(),
        }

    async def process_query(self, query: CouncilQuery) -> CouncilResponse:
        agent_ids = query.agent_ids or list(self.agents.keys())

        # Query all agents in parallel
        tasks = [
            self._query_agent(agent_id, query.query)
            for agent_id in agent_ids
            if agent_id in self.agents
        ]

        responses = await asyncio.gather(*tasks, return_exceptions=True)
        # ... process responses and generate consensus

        return CouncilResponse(
            query=query.query,
            agent_responses=responses,
            consensus=consensus
        )
```

### Base Agent

```python
# features/agents/base_agent.py
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Tuple

class BaseAgent(ABC):
    def __init__(self, name: str, provider: str, model: str):
        self.name = name
        self.provider = provider
        self.model = model

    @abstractmethod
    async def generate_response(self, query: str) -> Tuple[str, int]:
        """Generate response and return (text, tokens_used)."""
        pass

    @abstractmethod
    async def stream_response(self, query: str) -> AsyncGenerator[str, None]:
        """Stream response chunks."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if agent is healthy."""
        pass
```

## LangGraph Workflows

### Multi-Agent Workflow

```python
# workflows/multi_agent.py
from typing import TypedDict, Annotated, Sequence
from operator import add

class AgentState(TypedDict):
    query: str
    agent_responses: Annotated[Sequence[dict], add]
    consensus: str
    metadata: dict

class MultiAgentWorkflow:
    def __init__(self):
        self._setup_graph()

    def _setup_graph(self):
        # LangGraph state graph setup
        pass

    async def run(self, query: str) -> dict:
        # Execute workflow
        pass
```

## Adding New Features

1. Create a new folder in `src/features/`
2. Add `__init__.py`, `router.py`, `service.py`, `schema.py`
3. Export the router in `__init__.py`
4. Include the router in `main.py`

Example:

```
src/features/new_feature/
├── __init__.py
├── router.py
├── service.py
└── schema.py
```

## Testing

```bash
# Run all tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src

# Run specific test file
poetry run pytest tests/features/council/test_council.py

# Run in verbose mode
poetry run pytest -v
```

## Building & Deployment

### Production

```bash
# Build with Poetry
poetry build

# Run production server
poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

### Deploy to Railway

1. Connect GitHub repository
2. Set Python version: `3.11`
3. Add environment variables
4. Build command: `pip install poetry && poetry install`
5. Start command: `poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT`

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN pip install poetry

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && poetry install --no-dev

COPY src/ ./src/

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Cost Analysis

### LLM API Costs (per 1000 tokens)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4 Turbo | $0.01 | $0.03 |
| Claude 3 Opus | $0.015 | $0.075 |
| Claude 3 Sonnet | $0.003 | $0.015 |
| Gemini Pro | $0.00025 | $0.0005 |

### Estimated Monthly Costs (5K queries)

| Model Mix | Cost |
|-----------|------|
| GPT-4 only | ~$15 |
| Claude only | ~$12 |
| Mixed (recommended) | ~$8.63 |

## Notes

- Always use async/await for I/O operations
- Implement proper error handling and logging
- Use Pydantic for all request/response validation
- Keep feature modules self-contained
- Use dependency injection for services
- Stream responses for better UX

---

**Questions?** Check the [main README](../../README.md) or open an issue.

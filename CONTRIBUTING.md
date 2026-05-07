# Contributing to Consilium

Consilium is a multi-AI agent deliberation platform where models argue, critique, and synthesize consensus across 8 research-backed debate modes. We welcome contributions ranging from bug fixes to new deliberation modes and benchmarks.

## Development Setup

### Prerequisites

- Node.js >= 20
- Python >= 3.11
- pnpm >= 9
- Docker (optional, for local Redis/Postgres)
- A Neon PostgreSQL database or local Postgres instance

### Clone and Install

```bash
git clone https://github.com/SentientAI-DAO/Consilium.git
cd Consilium
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env` in each app that needs it (`apps/web`, `apps/api`, `apps/agents`) and fill in the required values. See `CLAUDE.md` for the full list of integrations and their env vars.

### Run the Stack

```bash
# API
cd apps/api && pnpm dev

# Web
cd apps/web && pnpm dev

# Agents (Python)
cd apps/agents && pip install -r requirements.txt && uvicorn main:app --reload
```

### Database

```bash
cd packages/database
pnpm prisma generate
pnpm prisma db push
```

## Running Tests

### Python Deliberation Tests

```bash
cd apps/agents
python -m pytest
```

### TypeScript Lint and Typecheck

```bash
pnpm lint
pnpm typecheck
```

### Bot E2E Pipeline

```bash
python -m agents.scripts.test_pipeline_e2e
```

## Pull Request Guidelines

### Branch Naming

| Prefix  | Purpose                        |
| ------- | ------------------------------ |
| `feat/` | New features                   |
| `fix/`  | Bug fixes                      |
| `test/` | Test additions or improvements |
| `data/` | Dataset or benchmark changes   |
| `docs/` | Documentation updates          |

### PR Process

1. Create a branch from `main` using the naming convention above
2. Make your changes in focused, atomic commits
3. Ensure lint and typecheck pass
4. Open a PR with a clear title and description
5. Link any relevant Linear tickets (MYC- prefix)

## Code Style

- **No comments in code** -- use descriptive names instead
- Follow existing patterns in the file you are editing
- TypeScript: strict mode, shared types live in `packages/shared/`
- Python: type hints, no subprocess where direct imports work
- Model IDs use current versions (April 2026 lineup): `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-7`, `gpt-5.4`, `gemini-3-flash-preview`, `gemini-3.1-pro-preview`. Legacy IDs are aliased to current replacements but should not be hardcoded in new code.
- Never duplicate types that exist in `packages/shared/`

## Architecture Overview

```
Web (Next.js 15) --> API (NestJS 11/Fastify) --> Agents (FastAPI/Python)
                                                |
                                       Debate Orchestrator
                                       |-- Round 1: Independent Analysis
                                       |-- Round 2: Cross-Examination
                                       |-- Round 3: Rebuttal & Refinement
                                       +-- Judge: 5-Phase Synthesis
```

- **Web App** (`apps/web/`): Next.js 15 with Clerk auth, Stripe billing, shadcn/ui
- **API** (`apps/api/`): NestJS 11 on Fastify, BullMQ for async jobs, Prisma ORM
- **Agents** (`apps/agents/`): FastAPI deliberation engine, 5 LLM providers
- **Database** (`packages/database/`): Prisma schema on Neon PostgreSQL
- **Shared** (`packages/shared/`): TypeScript types shared across packages

## Adding a New Deliberation Mode

1. Define the mode schema in `apps/agents/src/features/council/modes/`
2. Implement the orchestration logic following the existing mode patterns (see `council`, `devil`, `oracle` for examples)
3. Register the mode in the mode registry
4. Add the mode to the API's deliberation service in `apps/api/src/features/deliberation/`
5. Add corresponding types to `packages/shared/`
6. Write tests covering the new mode's rounds and judge phase
7. Update the web UI's mode selector in `apps/web/`

## Adding a Benchmark

1. Create a directory under `benchmarks/` with your benchmark name
2. Include a `README.md` describing the dataset, methodology, and reproduction steps
3. Provide a script that runs the benchmark end-to-end
4. Submit results in a structured format (JSON or CSV) with model versions and timestamps
5. Open a PR with the `data/` branch prefix

## AI-Assisted Development

This project uses Claude Code for development. See [CLAUDE.md](CLAUDE.md) for project conventions, architecture details, and instructions that guide AI-assisted contributions.

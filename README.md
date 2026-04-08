# Consilium

Multi-LLM adversarial debate platform. Consilium orchestrates 5 AI providers through a structured council protocol -- 3-round debates with a 5-phase judge -- to produce higher-quality answers than any single model alone.

## Overview

Consilium runs multiple LLM providers in parallel, pits them against each other in adversarial debate rounds, and synthesizes the best reasoning into a final verdict. Users bring their own API keys (BYOK) and pay only for the tokens they use.

**Core capabilities:**

- Council Protocol: 3-round adversarial debate (Independent Analysis, Critique & Refinement, Final Convergence) with a 5-phase Judge (claim extraction, cross-reference, dispute resolution, scoring, synthesis)
- 4 debate modes: `quick` (1 round), `council` (3 rounds), `deep` (5 rounds + sub-agents), `blind` (3 rounds, anonymous)
- 5 LLM providers: OpenAI, Anthropic, Google, Groq, XAI
- Real-time SSE streaming of all model responses
- Convergence detection with early-exit when models reach agreement
- Circuit breaker pattern for automatic provider failover
- Model anonymization in blind mode
- Per-model cost tracking with token-level granularity
- Debate checkpointing
- BYOK (bring your own keys) -- no markup on API costs

## Architecture

```
+----------------------------------------------------------+
|  FRONTEND (Next.js 15.2.3)                               |
|  Vercel                                                  |
|  Clerk auth, dark mode, Zustand + TanStack Query         |
|  shadcn/ui + Radix, Framer Motion, Recharts              |
+----------------------------+-----------------------------+
                             | REST + SSE
+----------------------------v-----------------------------+
|  API (NestJS 11 + Fastify)           port 4000           |
|  Render (free tier)                  prefix /api/v1      |
|  Clerk auth, BullMQ + Redis, Prisma ORM                  |
|  Swagger at /api/docs, Terminus health checks            |
+----------------------------+-----------------------------+
                             | HTTP
+----------------------------v-----------------------------+
|  AI WORKERS (Python FastAPI)         port 8000           |
|  LLM routing, 3-round debate, convergence detection      |
|  Circuit breaker, cost tracking, anonymizer              |
+----------------------------+-----------------------------+
                             |
+----------------------------v-----------------------------+
|  DATA LAYER                                              |
|  Neon PostgreSQL (Prisma, 16 models) | Upstash Redis     |
+----------------------------------------------------------+
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15.2.3 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui + Radix, Zustand, TanStack Query, Framer Motion, Recharts |
| API | NestJS 11, Fastify, TypeScript, BullMQ, Prisma ORM, Swagger |
| AI Workers | Python, FastAPI, 5 LLM providers |
| Database | Neon PostgreSQL (Prisma, 16 models) |
| Cache | Upstash Redis |
| Auth | Clerk |
| CLI | `@consilium/cli` -- TypeScript, Commander.js (`consilium` command) |
| Shared Packages | `@consilium/shared` (debates, providers, ids, SSE types), `@consilium/ui` (Button, Card, Input), `@consilium/config` (ESLint, TypeScript, Prettier) |
| Monitoring | Sentry (frontend, API, workers) |
| CI/CD | GitHub Actions (9 workflows: CI, PR checks, Docker, Coverage, E2E, SonarQube, Security, Claude Code, Linear sync) |
| Monorepo | pnpm 9.15.0 + Turborepo |

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9.15.0
- Python >= 3.11
- Docker (optional)

### Installation

```bash
git clone https://github.com/skadri1601/Consilium.git
cd Consilium

pnpm install

cp .env.example .env.local
# Add your API keys to .env.local
```

### Docker Setup

```bash
docker-compose up -d
```

Starts postgres, redis, api, agents, web, redis-commander, and mailhog.

### Database Setup

```bash
pnpm db:migrate
pnpm db:generate
```

### Start Development

```bash
pnpm dev
```

This starts:

- Frontend: http://localhost:3000
- API: http://localhost:4000 (Swagger at http://localhost:4000/api/docs)
- AI Workers: http://localhost:8000

## Project Structure

```
Consilium/
├── apps/
│   ├── web/                  # Next.js 15 frontend
│   ├── api/                  # NestJS 11 + Fastify API
│   └── agents/               # Python FastAPI AI workers
├── packages/
│   ├── shared/               # @consilium/shared (debates, providers, ids, SSE types)
│   ├── ui/                   # @consilium/ui (Button, Card, Input)
│   ├── database/             # Prisma schema & migrations (16 models)
│   └── config/               # @consilium/config (ESLint, TypeScript, Prettier)
├── docker-compose.yml
├── render.yaml               # Render deployment blueprint
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

### Web Routes

**App:** `/council`, `/debates/[id]`, `/history`, `/settings`, `/analytics`, `/personas`, `/agents`

**Marketing:** `/`, `/about`, `/faq`, `/privacy`, `/terms`

**Auth:** `/sign-in`, `/sign-up`

## CLI

`@consilium/cli` provides 8 commands and 4 debate modes.

```bash
pnpm cli:install

consilium debate "your question"     # start a debate
consilium ask "quick question"       # single-shot query
consilium chat                       # interactive chat
consilium config                     # manage settings
consilium login                      # authenticate
consilium debug                      # debug info
consilium logs                       # view logs
consilium stats                      # usage statistics
```

**Modes:** `--mode quick` (1 round), `--mode council` (3 rounds), `--mode deep` (5 rounds + sub-agents), `--mode blind` (3 rounds, anonymous)

Features: codebase scanning, session management, BYOK key configuration.

## Environment Variables

Create `.env.local` in the project root:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# LLM Providers (BYOK)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."
XAI_API_KEY="xai-..."

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Monitoring (Sentry)
SENTRY_DSN="https://..."

# App URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

See `.env.example` for the complete list.

## Testing

```bash
pnpm test              # all tests
pnpm test:e2e          # end-to-end tests
```


## CI/CD

9 GitHub Actions workflows:

- **CI** -- build, lint, type-check across all packages
- **PR Checks** -- automated pull request validation
- **Docker** -- container build and push
- **Coverage** -- test coverage reporting
- **E2E** -- end-to-end test suite
- **SonarQube** -- code quality analysis
- **Security** -- dependency and code scanning
- **Claude Code** -- AI-assisted code review
- **Linear Sync** -- issue tracker synchronization

## Scripts

```bash
# 1. Push to GitHub
git push origin main

# 2. Connect Vercel (automatic deployment)
# Visit vercel.com → Import Project → Select GitHub repo

# 3. Deploy to Railway
# Visit railway.com → New Project → Deploy from GitHub
# Add environment variables in Railway dashboard

# 4. Neon database is already live (no deployment needed)
```

See deployment guides in `docs/deployment/`.

## 🔒 Security

- ✅ Row-Level Security (RLS) for multi-tenancy
- ✅ API key rotation via Vault/Secrets Manager
- ✅ Rate limiting per tenant
- ✅ Input validation with Zod schemas
- ✅ CORS and CSP headers
- ✅ SQL injection prevention via Prisma
- ✅ Secrets never committed to git

## 📊 Monitoring

- **Application**: Sentry error tracking
- **LLM Calls**: Langfuse observability
- **Infrastructure**: Railway metrics / Datadog
- **Costs**: Per-tenant LLM cost tracking

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# 1. Fork the repository
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Commit changes
git commit -m 'Add amazing feature'

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Open Pull Request
```

> **Note:** Git commands work identically on Windows, macOS, and Linux.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## 📚 Documentation Structure

### Getting Started
- **[Quick Start Guide](./docs/guides/getting-started.md)** - Get up and running in 5 minutes
- **[Self-Hosting](./docs/guides/self-hosting.md)** - Deploy on your infrastructure
- **[FAQ](./docs/guides/faq.md)** - Frequently asked questions
- **[Export Formats](./docs/guides/export-formats.md)** - Output format documentation

### Application Documentation
- **[Web App](./apps/web/README.md)** - Next.js frontend documentation
- **[API Server](./apps/api/README.md)** - NestJS backend documentation
- **[AI Workers](./apps/agents/README.md)** - Python agents documentation
- **[Database](./packages/database/README.md)** - Prisma schema and migrations

### Development
- **[Project Tasks](./docs/guides/project-tasks.md)** - Development task breakdown
- **[API Reference](./docs/api/README.md)** - REST API documentation

## 💬 Support

- Email: er.saadk16@gmail.com

---

**Built with ❤️ using LangGraph, NestJS, and Next.js**

# [Consilium] - AI Council Platform

> Multi-AI agent orchestration system that enables collaborative problem-solving across different LLMs with blind evaluation and consensus features.

## 🎯 Overview

AI Council is a production-grade platform that orchestrates multiple AI models (GPT-4o-mini, Claude, Gemini, Grok etc.) to collaboratively solve complex problems. Instead of trying different AI models sequentially, AI Council runs them in parallel, analyzes their approaches, and presents the best solutions through blind evaluation.

**Key Features:**
- 🤝 Multi-agent deliberation with LangGraph orchestration
- 🎭 Blind evaluation - removes model bias by anonymizing outputs
- 📊 Consensus analysis showing where models agree/disagree
- 🚀 Real-time streaming of agent responses via Server-Sent Events
- 🔐 Multi-tenancy with Row-Level Security
- 📈 Usage analytics and per-model cost tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 + Vercel AI SDK)                  │
│  - Vercel Hobby (Free)                                  │
│  - Real-time streaming UI with SSE                      │
│  - Multi-agent conversation views                       │
│  - Blind evaluation interface                           │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API + Server-Sent Events
┌─────────────────▼───────────────────────────────────────┐
│  API LAYER (NestJS + TypeScript)                        │
│  - Railway Hobby ($5/month)                             │
│  - Clerk authentication                                 │
│  - Rate limiting & tenant management                    │
│  - BullMQ job queue                                     │
└─────────────────┬───────────────────────────────────────┘
                  │ Queue Jobs + HTTP
┌─────────────────▼───────────────────────────────────────┐
│  AI WORKERS (Python + LangGraph)                        │
│  - Railway or same container                            │
│  - Multi-agent orchestration                            │
│  - LLM routing (GPT-4o-mini, Claude, Gemini)            │
│  - Semantic caching with Redis                          │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│  DATA LAYER                                             │
│  - Neon PostgreSQL                                      │
│  - Upstash Redis                                        │
│  - 10,000 pooled connections                            │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack (Finalized for Bootstrap Launch)

### Frontend (`apps/web`)
- **Framework**: Next.js 15 (App Router)
- **Hosting**: Vercel Hobby (Free)
- **UI Library**: React 18 + TypeScript
- **AI Integration**: Vercel AI SDK 6
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS + shadcn/ui
- **Real-time**: Server-Sent Events

### Backend (`apps/api`)
- **Framework**: NestJS + Fastify adapter
- **Hosting**: Railway Hobby ($5/month)
- **Language**: TypeScript 5.7+
- **API Protocol**: REST
- **Authentication**: Clerk (Free for 10K MAU)
- **Validation**: Zod schemas
- **Job Queue**: BullMQ + Upstash Redis

### AI Workers (`apps/agents`)
- **Framework**: LangGraph (Python)
- **LLM APIs**: GPT-4o-mini, Claude 3.5 Haiku, Gemini 2.0 Flash
- **API Framework**: FastAPI
- **Observability**: Langfuse (self-hosted)

### Infrastructure
- **Database**: Neon PostgreSQL (Free tier, upgrades to $19/month)
- **Cache**: Upstash Redis (Free tier)
- **Deployment**: Vercel + Railway
- **Monitoring**: Sentry Free (5K errors/month)
- **Email**: Resend Free (3K emails/month)
- **Payments**: Stripe (2.9% + $0.30)
- **Monorepo**: Turborepo + pnpm

##

 🚀 Quick Start

### Prerequisites

```bash
# Required
node >= 20.x
pnpm >= 9.x
python >= 3.11
docker >= 24.x
docker-compose >= 2.x (or docker compose for newer Docker Desktop)

# Optional but recommended
just (command runner)
direnv (environment management)
```

### Installation

**Windows (PowerShell):**
```powershell
# Clone repository
git clone https://github.com/yourusername/ai-council.git
cd ai-council

# Install dependencies (all workspaces)
pnpm install

# Setup environment variables
Copy-Item .env.example .env.local
# Edit .env.local with your API keys and configuration

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d
# Or with newer Docker Desktop: docker compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers (all apps in parallel)
pnpm dev
```

**macOS/Linux (Bash):**
```bash
# Clone repository
git clone https://github.com/yourusername/ai-council.git
cd ai-council

# Install dependencies (all workspaces)
pnpm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and configuration

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers (all apps in parallel)
pnpm dev
```

This starts:
- Frontend: http://localhost:3000
- API: http://localhost:4000
- AI Workers: http://localhost:8000
- Temporal UI: http://localhost:8233

### Development Workflow

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# Run all workspaces in dev mode
pnpm dev

# Run specific workspace
pnpm --filter @consilium/web dev
pnpm --filter @consilium/api dev
pnpm --filter @consilium/agents dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run tests
pnpm test

# Build all apps
pnpm build
```

> **Note:** `pnpm` commands work identically on Windows, macOS, and Linux.

## 📁 Project Structure

The project uses a **feature-based architecture** where each feature contains all its related files (components, hooks, services, types).

```
consilium/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router (routing only)
│   │   │   ├── features/      # Feature modules
│   │   │   │   ├── auth/      # Authentication
│   │   │   │   ├── council/   # Multi-agent chat
│   │   │   │   ├── agents/    # Agent management
│   │   │   │   ├── history/   # Conversation history
│   │   │   │   └── analytics/ # Usage analytics
│   │   │   └── shared/        # Shared components, hooks, utils
│   │   │       ├── components/ui/    # shadcn/ui
│   │   │       ├── components/layout/
│   │   │       ├── hooks/
│   │   │       └── lib/
│   │   └── package.json
│   │
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── features/      # Feature modules
│   │   │   │   ├── auth/      # Clerk authentication
│   │   │   │   ├── council/   # Council orchestration
│   │   │   │   ├── agents/    # Agent CRUD
│   │   │   │   ├── conversations/
│   │   │   │   ├── users/
│   │   │   │   └── analytics/
│   │   │   ├── shared/        # Shared utilities
│   │   │   │   ├── database/  # Prisma service
│   │   │   │   ├── config/
│   │   │   │   ├── guards/
│   │   │   │   └── filters/
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── agents/                 # Python AI workers
│       ├── src/
│       │   ├── features/      # Feature modules
│       │   │   ├── council/   # Council logic
│       │   │   ├── agents/    # LLM agents
│       │   │   ├── streaming/ # SSE streaming
│       │   │   └── health/
│       │   ├── shared/        # Shared utilities
│       │   │   ├── config/
│       │   │   ├── database/
│       │   │   └── utils/
│       │   ├── workflows/     # LangGraph workflows
│       │   └── main.py        # FastAPI app
│       └── pyproject.toml
│
├── packages/
│   ├── database/              # Prisma schema & migrations
│   ├── config/                # Shared configs (ESLint, TS)
│   └── ui/                    # Shared UI components (optional)
│
├── docker-compose.yml         # Local infrastructure
├── turbo.json                 # Turborepo configuration
├── pnpm-workspace.yaml        # pnpm workspace config
└── README.md                  # This file
```

## 🔑 Environment Variables

Create `.env.local` in the root directory:

**Windows (PowerShell):**
```powershell
# Copy the example file
Copy-Item .env.example .env.local
# Then edit .env.local with your API keys and configuration
```

**macOS/Linux (Bash):**
```bash
# Copy the example file
cp .env.example .env.local
# Then edit .env.local with your API keys and configuration
```

**Environment Variables:**

```bash
# Database (Neon PostgreSQL)
# Get from: https://console.neon.tech → Project → Connect
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Redis (Upstash)
# Get from: https://console.upstash.com → Database → Details
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxxxxxxxxxxxx"
REDIS_URL="rediss://default:xxx@xxx.upstash.io:6379"

# LLM Provider API Keys
OPENAI_API_KEY="sk-..."                    # https://platform.openai.com/api-keys
ANTHROPIC_API_KEY="sk-ant-..."             # https://console.anthropic.com
GOOGLE_API_KEY="AIza..."                   # https://aistudio.google.com/apikey

# Authentication (Clerk)
# Get from: https://dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Payments (Stripe)
# Get from: https://dashboard.stripe.com → Developers → API Keys
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Monitoring (Sentry)
# Get from: https://sentry.io → Project Settings → Client Keys
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# Email (Resend)
# Get from: https://resend.com/api-keys
RESEND_API_KEY="re_..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
JWT_SECRET="your-32-character-secret-here"
```

See `.env.example` for complete list with all variables.

## 🧪 Testing

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 📦 Deployment

### Production Build

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# Build all applications
pnpm build

# Build specific app
pnpm --filter @consilium/web build
```

### Deployment Targets

- **Frontend**: Vercel (automatic via GitHub integration)
- **Backend API**: Railway Hobby ($5/month)
- **AI Workers**: Railway (same container or separate)
- **Database**: Neon PostgreSQL (Free → Launch $19)

### Quick Deploy to Production

**Windows (PowerShell) / macOS/Linux (Bash):**
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

# Consilium API

NestJS 11 backend providing REST API, SSE streaming, and job queue orchestration for AI debate workers.

## Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Runtime    | NestJS 11 + Fastify                                     |
| Hosting    | DigitalOcean droplet (`docker-compose.droplet.yml`)     |
| Auth       | Clerk SDK                                               |
| Database   | Prisma ORM + Neon PostgreSQL                            |
| Queue      | BullMQ (`debate-jobs`, 3 attempts, exponential backoff) |
| Cache      | ioredis + Upstash Redis                                 |
| Monitoring | Sentry + Terminus health checks                         |
| Docs       | Swagger at `/api/docs`                                  |
| Email      | Resend                                                  |
| Validation | class-validator + Zod                                   |

## Getting Started

```bash
pnpm install
cp .env.example .env   # then fill in values
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

Server runs on `http://localhost:4000` with prefix `/api/v1`.

### Environment Variables

```
PORT=4000
API_PREFIX=api/v1
DATABASE_URL=postgresql://...@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
REDIS_URL=redis://...
CLERK_SECRET_KEY=sk_test_...
SENTRY_DSN=https://...
RESEND_API_KEY=re_...
```

## Feature Modules

| Module        | Description                                 |
| ------------- | ------------------------------------------- |
| auth          | Clerk authentication, guards, decorators    |
| agents        | Agent configuration and management          |
| analytics     | Usage metrics and reporting                 |
| api-keys      | BYOK key management                         |
| conversations | Conversation history (v1 + v2)              |
| council       | Multi-agent orchestration                   |
| debates       | Debate creation, streaming, cost estimation |
| personas      | Agent persona definitions                   |
| users         | User profiles and preferences               |
| waitlist      | Early access waitlist                       |
| webhooks      | Webhook subscriptions and delivery          |

## Shared Modules

| Module       | Purpose                                  |
| ------------ | ---------------------------------------- |
| config       | App configuration                        |
| database     | Prisma client provider                   |
| decorators   | Custom route/param decorators            |
| filters      | Exception filters                        |
| guards       | Auth and rate-limit guards               |
| interceptors | Response transformation                  |
| pipes        | Validation pipes                         |
| queue        | BullMQ producer/consumer setup           |
| services     | audit-logger, email, encryption, session |

## Key Endpoints

```
POST   /api/v1/debates              Create a debate
GET    /api/v1/debates/:id/stream   SSE stream for debate events
POST   /api/v1/debates/estimate     Cost estimate
POST   /api/v1/debates/:id/cancel   Cancel a running debate
POST   /api/v1/debates/:id/retry    Retry a failed debate
GET    /api/v1/debates/:id/conversation  Debate conversation history

GET    /api/v1/api-keys             List BYOK keys
PUT    /api/v1/api-keys             Update BYOK keys
POST   /api/v1/api-keys/test        Validate keys

GET    /api/v1/conversations        List conversations
POST   /api/v1/conversations        Create conversation

POST   /api/v1/council/query        Query the council

GET    /health                      Health check
GET    /health/ready                Readiness probe
GET    /health/live                 Liveness probe
GET    /health/info                 App info
```

## Scripts

```bash
pnpm dev              # Development server with hot reload
pnpm build            # Production build
pnpm start:prod       # Start production server
pnpm lint             # Lint
pnpm type-check       # Type check
pnpm test             # Unit tests
pnpm test:cov         # Test coverage
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:migrate   # Run migrations
```

## Deployment

Deployed to a DigitalOcean droplet via `docker-compose.droplet.yml`. Run `deploy.sh` on the droplet to pull `main`, rebuild containers, and restart services.

Build command: `pnpm install && pnpm build`
Start command: `pnpm start:prod`

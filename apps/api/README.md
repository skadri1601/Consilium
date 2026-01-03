# Consilium Backend API

> NestJS application providing REST API, real-time streaming, and job queue orchestration for Python AI workers.

## Overview

The Consilium backend serves as the orchestration layer between the Next.js frontend and Python AI workers. Built with NestJS and Fastify, it handles authentication (Clerk), rate limiting, tenant management, and real-time communication while maintaining clean separation of concerns.

**Hosted on Railway Hobby ($5/month)** with automatic deployments from GitHub.

## Key Features

- **REST API**: CRUD operations for agents, conversations, and users
- **Real-time Streaming**: Server-Sent Events for LLM token streaming
- **Job Queue**: BullMQ + Upstash Redis for async AI tasks
- **Multi-tenancy**: Row-Level Security with Neon PostgreSQL
- **Rate Limiting**: Per-tenant throttling with Redis
- **Type-safe**: End-to-end TypeScript with Prisma

## Tech Stack

- **Framework**: NestJS 11+ (with Fastify adapter)
- **Hosting**: Railway Hobby ($5/month)
- **Language**: TypeScript 5.7+
- **Database**: Neon PostgreSQL (Free tier)
- **ORM**: Prisma 6+
- **Cache**: Upstash Redis (Free tier)
- **Queue**: BullMQ
- **Authentication**: Clerk
- **Validation**: Zod + class-validator
- **Testing**: Jest + Supertest

## Project Structure

The backend uses a **feature-based architecture** where each feature contains all its related files.

```
apps/api/
├── src/
│   ├── main.ts                    # Application bootstrap
│   ├── app.module.ts              # Root module
│   ├── health.controller.ts       # Health check endpoint
│   │
│   ├── features/                  # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── guards/
│   │   │   │   └── clerk-auth.guard.ts
│   │   │   ├── decorators/
│   │   │   │   └── current-user.decorator.ts
│   │   │   ├── dto/
│   │   │   └── index.ts           # Public exports
│   │   │
│   │   ├── council/               # Multi-agent orchestration
│   │   │   ├── council.module.ts
│   │   │   ├── council.controller.ts
│   │   │   ├── council.service.ts
│   │   │   ├── dto/
│   │   │   └── index.ts
│   │   │
│   │   ├── agents/                # Agent management
│   │   │   ├── agents.module.ts
│   │   │   ├── agents.controller.ts
│   │   │   ├── agents.service.ts
│   │   │   ├── dto/
│   │   │   └── index.ts
│   │   │
│   │   ├── conversations/         # Conversation history
│   │   │   ├── conversations.module.ts
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.service.ts
│   │   │   ├── dto/
│   │   │   └── index.ts
│   │   │
│   │   ├── users/                 # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   └── index.ts
│   │   │
│   │   └── analytics/             # Usage analytics
│   │       ├── analytics.module.ts
│   │       ├── analytics.controller.ts
│   │       ├── analytics.service.ts
│   │       └── index.ts
│   │
│   ├── shared/                    # Shared utilities
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── app.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   └── index.ts
│   │   ├── guards/
│   │   │   └── rate-limit.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── index.ts
│   │
│   └── jobs/                      # Background jobs
│       ├── processors/
│       │   └── agent-task.processor.ts
│       └── queues/
│           └── agent-tasks.queue.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── nest-cli.json
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

```bash
node >= 20.x
pnpm >= 9.x
```

### Installation

```bash
# From monorepo root
pnpm install

# Or install only backend dependencies
cd apps/api
pnpm install
```

### Environment Variables

Create `apps/api/.env`:

```bash
# Application
NODE_ENV=development
PORT=3001
API_PREFIX=api/v1

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Redis (Upstash)
UPSTASH_REDIS_URL="https://xxx.upstash.io"
UPSTASH_REDIS_TOKEN="xxx"

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...

# LLM Provider Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Monitoring
SENTRY_DSN=https://...
```

### Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Open Prisma Studio
pnpm prisma studio
```

### Development

```bash
# Start development server (with hot reload)
pnpm dev

# Start in debug mode
pnpm start:debug

# Type checking
pnpm type-check

# Linting
pnpm lint
```

Server runs on [http://localhost:3001](http://localhost:3001)

API Documentation: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

## Code Examples

### Feature Controller

```typescript
// features/agents/agents.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('agents')
@Controller('agents')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  async create(
    @Body() createAgentDto: CreateAgentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.agentsService.create(createAgentDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all agents for tenant' })
  async findAll(@CurrentUser() user: CurrentUserData) {
    return this.agentsService.findAllByTenant(user.tenantId);
  }
}
```

### Feature Service with Prisma

```typescript
// features/agents/agents.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgentDto, tenantId: string) {
    return this.prisma.agent.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAllByTenant(tenantId: string) {
    return this.prisma.agent.findMany({
      where: { tenantId },
      include: {
        conversations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
```

### Feature Module

```typescript
// features/agents/agents.module.ts
import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
```

### Feature Index Exports

```typescript
// features/agents/index.ts
export * from './agents.module';
export * from './agents.controller';
export * from './agents.service';
```

## Adding New Features

1. Create a new folder in `src/features/`
2. Add module, controller, service, and dto files
3. Create an `index.ts` for public exports
4. Import the module in `app.module.ts`

```bash
# Using NestJS CLI
nest g module features/new-feature
nest g controller features/new-feature
nest g service features/new-feature
```

## Database: Neon PostgreSQL

### Why Neon (Not Supabase)

| Feature | Neon | Why It Matters |
|---------|------|----------------|
| **Pooled connections** | 10,000 | No connection exhaustion |
| **Scale-to-zero** | Yes | Save costs during idle |
| **Pricing** | $0 → $19/month | Cheaper than Supabase Pro |

### Multi-tenancy with Row-Level Security

```sql
-- Enable RLS on all tenant tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation ON conversations
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

## Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:cov
```

## Building & Deployment

### Production Build

```bash
pnpm build
pnpm start:prod
```

### Deploy to Railway

1. Connect GitHub repository
2. Add environment variables
3. Configure build: `pnpm install && pnpm build`
4. Configure start: `pnpm start:prod`
5. Automatic deployments on push

## Cost Analysis

### Railway Hobby Plan ($5/month)

| Resource | Typical Usage (100 users) |
|----------|---------------------------|
| CPU | 0.1-0.3 vCPU |
| RAM | 256-512MB |
| Network | 2-10GB/month |
| Monthly cost | $3-8 (within $5 credit) |

**When to upgrade to Railway Pro ($20/month):**
- Exceeding $5 usage credits consistently
- Need 99.9% uptime SLA
- Require team collaboration features

## Notes

- Always validate DTOs with class-validator
- Use Prisma for all database queries
- Implement proper error handling with custom exception filters
- Log all errors with correlation IDs for tracing
- Keep controllers thin - business logic belongs in services
- Import from features using relative paths within feature, absolute for cross-feature

---

**Questions?** Check the [main README](../../README.md) or open an issue.

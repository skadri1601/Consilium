# Self-Hosting Guide

Consilium is open source and can be self-hosted on your own infrastructure. This gives you full control over your data and API keys.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (or use Neon)
- Redis instance (or use Upstash)
- API keys for AI providers (OpenAI, Anthropic, Google AI, Groq)
- At least 2GB RAM and 2 CPU cores

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/consilium.git
cd consilium
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp env.example.txt .env.local
```

Edit `.env.local` and configure:

**Database:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/consilium"
```

**Redis:**
```env
REDIS_URL="redis://localhost:6379"
```

**AI Provider Keys:**
```env
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."
```

**Clerk Authentication:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

**Encryption:**
```env
ENCRYPTION_KEY="[64 hex characters]"
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis
- NestJS API (port 4000)
- FastAPI AI workers (port 8000)
- Next.js frontend (port 3000)

### 4. Run Database Migrations

```bash
cd apps/api
pnpm prisma migrate dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Docs: http://localhost:4000/api/docs
- AI Workers: http://localhost:8000

## Docker Compose Services

### PostgreSQL

Stores all application data:
- Users
- Debate sessions
- API keys (encrypted)
- Audit logs

**Data persistence:** Data is stored in a Docker volume.

### Redis

Used for:
- Rate limiting
- Session management
- Job queue (BullMQ)
- Token blacklisting

**Data persistence:** Configured with persistence enabled.

### API (NestJS)

Backend API service:
- Handles authentication
- Manages debates
- Proxies SSE streams
- Processes job queue

**Health check:** `GET /health`

### AI Workers (FastAPI)

Python service for AI orchestration:
- Runs debate workflows
- Calls LLM APIs
- Streams responses via SSE

**Health check:** `GET /health`

### Frontend (Next.js)

React frontend application:
- User interface
- Authentication pages
- Dashboard and debate UI

## Production Deployment

### Using Railway

1. Create a Railway account
2. Create new project from GitHub
3. Add services for:
   - Backend (NestJS)
   - AI Workers (FastAPI)
   - Frontend (Next.js)
4. Configure environment variables
5. Set up PostgreSQL and Redis addons

### Using Docker Swarm / Kubernetes

See `docker-compose.prod.yml` for production configuration:

```bash
docker stack deploy -c docker-compose.prod.yml consilium
```

### Manual Deployment

1. **Build applications:**
   ```bash
   # Backend
   cd apps/api
   pnpm build
   
   # Frontend
   cd apps/web
   pnpm build
   
   # AI Workers
   cd apps/agents
   poetry build
   ```

2. **Set up reverse proxy** (Nginx/Traefik):
   - Frontend: `app.consiliumai.com`
   - API: `api.consiliumai.com`
   - AI Workers: Internal only

3. **Configure SSL** with Let's Encrypt

4. **Set up monitoring:**
   - Health checks
   - Log aggregation
   - Error tracking (Sentry)

## Environment Variables

### Required

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CLERK_SECRET_KEY`: Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `ENCRYPTION_KEY`: 64-character hex string for API key encryption

### Optional

- `OPENAI_API_KEY`: For OpenAI models (or user-provided)
- `ANTHROPIC_API_KEY`: For Anthropic models (or user-provided)
- `GOOGLE_API_KEY`: For Google AI models (or user-provided)
- `GROQ_API_KEY`: For Groq models (or user-provided)
- `AI_WORKERS_URL`: URL for AI workers service (default: http://localhost:8000)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:4000)
- `SENTRY_DSN`: Error tracking (optional)

## Database Setup

### Using Neon

1. Create a Neon account
2. Create a new project
3. Copy the connection string to `DATABASE_URL`
4. Run migrations:
   ```bash
   cd apps/api
   pnpm prisma migrate deploy
   ```

### Using Self-Hosted PostgreSQL

1. Install PostgreSQL 14+
2. Create database:
   ```sql
   CREATE DATABASE consilium;
   ```
3. Update `DATABASE_URL` in `.env.local`
4. Run migrations

## Redis Setup

### Using Upstash

1. Create an Upstash account
2. Create a Redis database
3. Copy connection URL to `REDIS_URL`

### Using Self-Hosted Redis

1. Install Redis 6+
2. Configure persistence (optional)
3. Update `REDIS_URL` in `.env.local`

## Security Considerations

### API Key Encryption

API keys are encrypted using AES-256-GCM. Ensure:
- `ENCRYPTION_KEY` is 64 hex characters
- Key is stored securely (not in version control)
- Key is rotated periodically

### Database Security

- Use strong passwords
- Enable SSL connections
- Restrict network access
- Regular backups

### Redis Security

- Use password authentication
- Restrict network access
- Enable TLS if possible

### Authentication

- Configure Clerk webhooks for user sync
- Set up proper redirect URLs
- Enable MFA for admin accounts

## Monitoring

### Health Checks

- API: `GET /health`
- AI Workers: `GET /health`
- Frontend: Built-in Next.js health check

### Logging

- Backend: Structured logging to console
- AI Workers: Python logging
- Frontend: Error boundary + Sentry (optional)

### Metrics

Monitor:
- API response times
- Debate completion rates
- Error rates
- Database connection pool
- Redis memory usage

## Troubleshooting

### Services won't start

1. Check Docker logs: `docker-compose logs`
2. Verify environment variables
3. Check port conflicts
4. Ensure Docker has enough resources

### Database connection errors

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Verify network connectivity
4. Check firewall rules

### AI workers not responding

1. Check AI workers logs: `docker-compose logs agents`
2. Verify API keys are set
3. Check `AI_WORKERS_URL` in backend config
4. Test health endpoint: `curl http://localhost:8000/health`

### Frontend can't connect to API

1. Verify `NEXT_PUBLIC_API_URL` is set
2. Check CORS configuration
3. Verify API is running
4. Check browser console for errors

## Backup and Recovery

### Database Backups

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Redis Backups

If using persistence:
- Redis automatically persists to disk
- Copy RDB files for manual backups

## Updates

1. Pull latest changes: `git pull`
2. Rebuild images: `docker-compose build`
3. Run migrations: `pnpm prisma migrate deploy`
4. Restart services: `docker-compose restart`

## Support

For self-hosting issues:
- Check [GitHub Issues](https://github.com/yourusername/consilium/issues)
- Review [Troubleshooting Guide](./troubleshooting.md)
- Open a discussion on GitHub


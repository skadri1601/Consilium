# Development Environment Setup - Complete ✅

The development environment for Consilium has been successfully configured. Follow the steps below to start all services.

## ✅ Completed Setup Steps

1. **Environment Variables** - `.env` file configured for local development
   - `DATABASE_URL` set to local PostgreSQL: `postgresql://consilium:consilium-dev-password-2024@localhost:5432/consilium`
   - `REDIS_URL` set to local Redis: `redis://localhost:6379`
   - `POSTGRES_PASSWORD` configured for Docker Compose

2. **Dependencies Installed** - All Node.js packages installed via pnpm
   - Root workspace dependencies
   - `apps/api` (NestJS backend)
   - `apps/web` (Next.js frontend)
   - `packages/*` (shared packages)

3. **Prisma Client Generated** - Database client generated from schema
   - Schema location: `apps/api/src/prisma/schema.prisma`
   - Client generated successfully

4. **Python Environment Setup** - Poetry virtual environment configured
   - All dependencies installed from `apps/agents/pyproject.toml`
   - Virtual environment active and ready

## 🚀 Starting Services

Start all services in separate terminal windows:

### Terminal 1: Infrastructure Services (PostgreSQL & Redis)

```powershell
# Navigate to project root
cd C:\Users\kadri\Consilium

# Start PostgreSQL and Redis containers
docker-compose up postgres redis
```

**What this starts:**
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379

**Wait for:** Both services to show "healthy" status before proceeding.

### Terminal 2: Database Migration

**IMPORTANT:** Run this AFTER Terminal 1 is running and PostgreSQL is healthy.

```powershell
# Navigate to API directory
cd C:\Users\kadri\Consilium\apps\api

# Ensure .env file exists with correct DATABASE_URL
# The .env file should contain:
# DATABASE_URL=postgresql://consilium:testpass123@localhost:5432/consilium

# Run database migrations
pnpm prisma migrate dev --schema=src/prisma/schema.prisma
```

**Note:** If you encounter authentication errors, verify:
1. The password in `.env` matches `POSTGRES_PASSWORD` in the root `.env` file
2. PostgreSQL container is fully started (wait 5-10 seconds after `docker-compose up`)
3. Test connection manually: `docker exec -e PGPASSWORD=testpass123 consilium-postgres psql -U consilium -d consilium -c "SELECT 1;"`

This will:
- Create the database schema
- Apply all migrations
- Generate Prisma Client

### Terminal 3: API Server

```powershell
# Navigate to API directory
cd C:\Users\kadri\Consilium\apps\api

# Start NestJS development server
pnpm dev
```

**What this starts:**
- NestJS API server on port 4000
- Watch mode enabled (auto-reload on changes)
- Connects to PostgreSQL and Redis

### Terminal 4: AI Workers

```powershell
# Navigate to agents directory
cd C:\Users\kadri\Consilium\apps\agents

# Start FastAPI server
poetry run uvicorn src.main:app --reload --port 8000
```

**What this starts:**
- FastAPI application on port 8000
- Auto-reload enabled for development
- Handles multi-agent orchestration with LangGraph

### Terminal 5: Frontend

```powershell
# Navigate to web directory
cd C:\Users\kadri\Consilium\apps\web

# Start Next.js development server
pnpm dev
```

**What this starts:**
- Next.js 15 development server on port 3000
- Hot module replacement enabled
- Connects to API at `http://localhost:4000`

## 🔍 Verification

After all services are running, verify they're working:

1. **PostgreSQL**: 
   ```powershell
   docker exec -it consilium-postgres psql -U consilium -d consilium -c "SELECT version();"
   ```

2. **Redis**: 
   ```powershell
   docker exec -it consilium-redis redis-cli ping
   ```
   Should return: `PONG`

3. **API**: Open browser to `http://localhost:4000/api` or check health endpoint

4. **AI Workers**: Open browser to `http://localhost:8000/docs` (FastAPI Swagger UI)

5. **Frontend**: Open browser to `http://localhost:3000`

## 📝 Next Steps

1. **Configure Clerk Authentication** (Required for user features)
   - Get keys from [Clerk Dashboard](https://dashboard.clerk.com)
   - Update `.env` file:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`

2. **Add LLM API Keys** (Optional - can use demo keys)
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com
   - Google AI: https://aistudio.google.com/apikey
   - Update `.env` file with your keys

3. **Run Tests**:
   ```powershell
   # From project root
   pnpm test
   ```

## 🐛 Troubleshooting

### Port Conflicts
If you get port conflicts, ensure these ports are available:
- 3000 (Frontend)
- 4000 (API)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 8000 (AI Workers)

### Database Connection Issues
- Ensure Docker Compose is running (Terminal 1)
- Verify `DATABASE_URL` in `.env` matches Docker credentials
- Check PostgreSQL container is healthy: `docker ps`

### Prisma Migration Issues
- Ensure PostgreSQL is running before running migrations (wait 5-10 seconds after starting)
- Verify `DATABASE_URL` in `apps/api/.env` matches the password in root `.env` file
- The password in root `.env` is: `testpass123` (set in `POSTGRES_PASSWORD`)
- Check database connection: `docker exec -e PGPASSWORD=testpass123 consilium-postgres psql -U consilium -d consilium -c "SELECT 1;"`
- If authentication fails, ensure `apps/api/.env` exists and contains: `DATABASE_URL=postgresql://consilium:testpass123@localhost:5432/consilium`

### Poetry Issues
- Verify virtual environment: `poetry env info`
- Reinstall dependencies: `poetry install`

## 📚 Additional Resources

- [Getting Started Guide](docs/getting-started.md)
- [API Documentation](docs/api/README.md)
- [Self-Hosting Guide](docs/self-hosting.md)

---

**Setup completed on:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")


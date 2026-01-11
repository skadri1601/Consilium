# Self-Hosting Guide

This guide will help you deploy Consilium on your own infrastructure.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (or use Docker Compose)
- Redis instance (or use Docker Compose)
- Domain name (optional, for production)

## Quick Start with Docker Compose

The easiest way to self-host is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/consilium.git
cd consilium

# Copy and configure environment variables
cp env.example.txt .env.local
# Edit .env.local with your configuration

# Start all services
docker-compose up -d

# Run database migrations
pnpm db:push
```

This will start:
- PostgreSQL database
- Redis cache
- NestJS API backend
- Python AI workers
- Next.js frontend

Access the application at http://localhost:3000

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Set up environment variables:**

```bash
# Database
DATABASE_URL="postgresql://user:pass@postgres:5432/consilium"
REDIS_URL="redis://redis:6379"

# Auth (Clerk or disable for self-hosted)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# LLM Provider Keys (for demo instance)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."
GROQ_API_KEY="gsk_..."

# Encryption key for API keys
ENCRYPTION_KEY="your-32-character-secret-key"
```

2. **Build and start:**

```bash
docker-compose up -d --build
```

3. **Set up reverse proxy (Nginx):**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Manual Deployment

#### Backend (NestJS)

```bash
cd apps/api
pnpm install
pnpm build
pnpm start:prod
```

#### AI Workers (FastAPI)

```bash
cd apps/agents
poetry install
poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

#### Frontend (Next.js)

```bash
cd apps/web
pnpm install
pnpm build
pnpm start
```

## Database Setup

### Using Docker Compose PostgreSQL

The `docker-compose.yml` includes a PostgreSQL service. No additional setup needed.

### Using External PostgreSQL

1. Create a database:
```sql
CREATE DATABASE consilium;
```

2. Update `DATABASE_URL` in `.env.local`

3. Run migrations:
```bash
pnpm db:push
```

## Redis Setup

### Using Docker Compose Redis

The `docker-compose.yml` includes a Redis service. No additional setup needed.

### Using External Redis

1. Install and start Redis
2. Update `REDIS_URL` in `.env.local`

## Authentication

### Option 1: Clerk (Recommended)

1. Create a Clerk account at https://clerk.com
2. Create an application
3. Add your domain to allowed origins
4. Copy API keys to `.env.local`

### Option 2: Disable Auth (Self-Hosted Only)

For internal use, you can disable authentication by modifying the middleware.

## SSL/HTTPS

Use a reverse proxy like Nginx or Caddy with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

## Monitoring

- **Application Logs**: Check Docker logs with `docker-compose logs`
- **Database**: Use Prisma Studio: `pnpm db:studio`
- **Redis**: Use Redis Commander (included in docker-compose)

## Troubleshooting

### Database Connection Issues

- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is running: `docker-compose ps`
- Check firewall rules

### API Key Issues

- Verify API keys are set in environment variables
- Check encryption key is set: `ENCRYPTION_KEY`
- Test keys individually in settings page

### Port Conflicts

If ports 3000, 4000, or 8000 are in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port
```

## Backup

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U consilium consilium > backup.sql

# Restore
docker-compose exec -T postgres psql -U consilium consilium < backup.sql
```

### Redis Backup

Redis data is persisted in Docker volume. Backup the volume:

```bash
docker run --rm -v consilium_redis_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/redis-backup.tar.gz /data
```

## Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Run migrations if needed
pnpm db:push
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/consilium/issues
- Documentation: https://github.com/yourusername/consilium/docs


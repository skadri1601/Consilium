FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Build
FROM base AS builder
WORKDIR /app

# Copy all workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @consilium/web build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

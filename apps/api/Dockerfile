FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Build
FROM base AS builder
WORKDIR /app

# Copy all workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @consilium/api build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/main.js"]

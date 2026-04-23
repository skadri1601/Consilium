FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter @consilium/shared build
RUN cd packages/database && npx tsc --outDir dist --declaration && \
    node -e "const p=require('./package.json');p.main='./dist/index.js';p.types='./dist/index.d.ts';require('fs').writeFileSync('package.json',JSON.stringify(p,null,2))"
RUN pnpm --filter @consilium/api build
RUN mkdir -p /app/node_modules/@consilium && \
    ln -sf /app/packages/shared /app/node_modules/@consilium/shared && \
    ln -sf /app/packages/database /app/node_modules/@consilium/database

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

ENV NODE_ENV=production

USER nestjs

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]

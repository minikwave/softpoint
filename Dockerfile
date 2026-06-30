# SoftPoint API — Railway / Docker (softpoint-api + softpoint-domain)
FROM node:20-bookworm-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/softpoint-domain ./packages/softpoint-domain
COPY apps/softpoint-api ./apps/softpoint-api

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @softpoint/domain run build

WORKDIR /app/apps/softpoint-api
RUN pnpm exec prisma generate && pnpm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]

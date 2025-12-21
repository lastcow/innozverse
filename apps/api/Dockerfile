# syntax = docker/dockerfile:1

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Build stage
FROM base AS builder

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy all packages and apps needed for build
COPY /packages/shared ./packages/shared
COPY /packages/config ./packages/config
COPY /apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @innozverse/shared build

# Build the API
RUN pnpm --filter @innozverse/api build

# Production stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built files and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/packages/shared/dist ./node_modules/@innozverse/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@innozverse/shared/package.json

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

EXPOSE 8080

CMD ["node", "dist/index.js"]

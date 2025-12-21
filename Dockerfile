# syntax = docker/dockerfile:1

FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.13.2 --activate

# Build stage
FROM base AS builder

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Ensure correct pnpm version is used (packageManager field in package.json now specifies 9.13.2)
RUN corepack enable && corepack prepare pnpm@9.13.2 --activate

# Copy all packages and apps needed for build
COPY packages/shared ./packages/shared
COPY packages/config ./packages/config
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages first
RUN pnpm --filter @innozverse/shared build

# Build the API
RUN pnpm --filter @innozverse/api build

# Create a deployable version using pnpm deploy
RUN pnpm --filter @innozverse/api --prod deploy /prod/api

# Production stage
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy the deployed application with all dependencies
COPY --from=builder /prod/api /app

# Copy the built shared package
COPY --from=builder /app/packages/shared/dist ./node_modules/@innozverse/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@innozverse/shared/package.json

EXPOSE 8080

CMD ["node", "dist/index.js"]

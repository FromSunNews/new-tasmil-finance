# Dockerfile for NestJS backend in pnpm monorepo
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

# Build stage
FROM base AS builder
WORKDIR /app

# Copy root workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy packages that backend depends on
COPY packages/typescript-config ./packages/typescript-config
COPY packages/eslint-config ./packages/eslint-config  
COPY packages/jest-config ./packages/jest-config

# Copy backend
COPY apps/backend ./apps/backend

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

# Check if build was successful
RUN ls -la dist/

# Production stage
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@8.15.5 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy workspace files for production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY apps/backend/package.json ./apps/backend/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Copy source files needed at runtime (migrations, etc.)
COPY --from=builder /app/apps/backend/migrations ./apps/backend/migrations

WORKDIR /app/apps/backend

# Check if files exist
RUN ls -la dist/

EXPOSE 9337

CMD ["node", "dist/main.js"]

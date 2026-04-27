# Getting Started

## Prerequisites

- Node.js compatible with Next.js 16 and React 19.
- `pnpm`.
- Docker, for the local PostgreSQL service.

## Install Dependencies

```bash
pnpm install
```

The `postinstall` script runs `prisma generate`, so the Prisma client should be generated after installation.

## Configure Environment

Copy `.env.example` to `.env` and adjust values when needed:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: secret used to sign authentication tokens. Use a strong value in production.

The default local database URL is:

```text
postgresql://postgres:postgres@localhost:5432/aleno?schema=public
```

## Start The Database

```bash
docker compose up -d
```

This starts PostgreSQL 15 on port `5432` with database `aleno`, user `postgres`, and password `postgres`.

## Prepare The Database

Run migrations and seed reading levels:

```bash
pnpm prisma migrate deploy
pnpm prisma db seed
```

For local schema iteration, use Prisma commands deliberately and review generated migrations before committing them.

## Run The App

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Verify The Project

```bash
pnpm test
pnpm run test:e2e
```

Use `pnpm run test:e2e:ui` only when interactive Playwright debugging is useful.

## First Files To Read

- `AGENTS.md`: repository rules for coding agents.
- `package.json`: scripts and dependency versions.
- `prisma/schema.prisma`: domain model.
- `src/app`: App Router pages and API routes.
- `src/lib`: shared database, auth, admin, audit, routing, and utility code.

# Deployment And Operations

## Build

The production build script is:

```bash
pnpm build
```

It runs:

```bash
prisma migrate deploy && next build
```

This means production deployments must have database connectivity and migration permissions before the Next.js build step runs.

## Start

```bash
pnpm start
```

This runs `next start` after a successful build.

## Required Environment

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: strong secret for JWT signing.

`prisma.config.ts` also supports `DIRECT_URL` when provided.

## Database Operations

- Migrations live in `prisma/migrations`.
- Deploy migrations with `prisma migrate deploy`.
- Seed reference reading levels with `pnpm prisma db seed` when a new environment needs base data.

## Observability

The application currently uses console logging and database audit logs. Audit logs are stored in the `AuditLog` model and exposed through admin routes.

## Operational Notes

- Keep `JWT_SECRET` stable across restarts or active tokens will become invalid.
- Use a managed PostgreSQL database for production.
- Restrict database credentials to the minimum permissions needed by the deployment model.
- Review admin routes carefully because they expose global operational data.

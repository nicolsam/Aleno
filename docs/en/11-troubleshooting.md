# Troubleshooting

## Database Connection Fails

Check that PostgreSQL is running:

```bash
docker compose up -d
```

Confirm `.env` contains a valid `DATABASE_URL`.

## Prisma Client Is Missing Or Stale

Run:

```bash
pnpm prisma generate
```

Then restart the dev server.

## Migrations Did Not Run

Run:

```bash
pnpm prisma migrate deploy
```

For local development, inspect migration state before creating or applying new migrations.

## Reading Levels Are Missing

Run:

```bash
pnpm prisma db seed
```

The app expects seeded reading levels for dashboard and student reading workflows.

## Login Works But Dashboard Calls Fail

Check browser `localStorage` for:

- `token`
- `teacher`

Also verify API calls include `Authorization: Bearer <token>`.

## Admin Pages Are Forbidden

The logged-in teacher must have `isGlobalAdmin` set to true in the database.

## Locale Looks Wrong

Check the `NEXT_LOCALE` cookie. The middleware supports `en` and `pt-BR`, and falls back to `pt-BR`.

## Playwright Cannot Reach The App

Playwright expects `http://localhost:3000`. Stop other servers on that port or let Playwright reuse an existing compatible server.

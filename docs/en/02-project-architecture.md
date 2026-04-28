# Project Architecture

## Stack

- Next.js `16.2.4` with the App Router.
- React `19.2.4`.
- TypeScript with strict mode enabled.
- Prisma `7.8.0` with PostgreSQL.
- `next-intl` for English and Brazilian Portuguese messages.
- Vitest for unit and integration tests.
- Playwright for end-to-end tests.
- Tailwind CSS and local UI components for styling.

## Top-Level Layout

- `src/app`: pages, layouts, and API route handlers.
- `src/components`: shared UI, skeletons, and app-level components.
- `src/lib`: shared server/client helpers such as auth, Prisma, audit logging, and admin checks.
- `src/messages`: locale message JSON files.
- `src/middleware.ts`: locale detection and `NEXT_LOCALE` cookie handling.
- `prisma`: schema, migrations, and seed script.
- `tests`: Vitest tests and Playwright E2E tests.
- `docs`: developer handbook.

## Runtime Shape

The browser stores the authentication token and teacher payload in `localStorage`. Dashboard pages read the token and call API routes using `Authorization: Bearer <token>`.

API routes validate tokens, use Prisma for database access, and enforce teacher-school access through `TeacherSchool` rows. Admin-only routes use `verifyAdmin`.

The dashboard supports a selected school filter stored in `localStorage` as `selectedSchool`. `src/app/dashboard/layout.tsx` broadcasts changes with a `schoolChanged` browser event.

## Important Conventions

- Use the `@/*` import alias for files under `src`.
- Keep route handlers under `src/app/api`.
- Keep user-facing page routes under `src/app`.
- Keep shared domain helpers in `src/lib`.
- Before changing Next.js behavior, read the relevant local docs in `node_modules/next/dist/docs/`.

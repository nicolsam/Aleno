# Development Workflow

## Before You Change Code

1. Read `AGENTS.md`.
2. Check current repo state with `git status --short`.
3. Read the nearby implementation and tests before editing.
4. For Next.js changes, read the relevant local guide in `node_modules/next/dist/docs/`.

This project uses a newer Next.js version than many examples online. Treat local docs and deprecation notices as authoritative.

## Implementation Guidelines

- Follow existing structure and naming.
- Keep functions focused and typed.
- Keep route validation close to route handlers.
- Use `src/lib` for shared behavior.
- Avoid changing API response shapes without updating frontend callers and tests.
- Preserve soft-delete behavior for schools, classes, and students.
- Keep English and Portuguese messages in sync.

## Database Changes

When a change affects the Prisma schema:

1. Update `prisma/schema.prisma`.
2. Generate and review a migration.
3. Update seed data if reference data changes.
4. Update API logic, frontend forms, and tests.
5. Document the behavior in `docs`.

## Documentation Changes

Update English first, then Portuguese. Keep headings and file order aligned between `docs/en` and `docs/pt-BR`.

## Final Checks

Use the checks relevant to the change:

```bash
pnpm test
pnpm run test:e2e
```

If tests fail because of your change, improve the code and rerun the failing checks.

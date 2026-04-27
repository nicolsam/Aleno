# Testing

## Unit And Integration Tests

Run Vitest with:

```bash
pnpm test
```

Vitest configuration lives in `vitest.config.ts`. Tests are included from `tests/**/*.test.ts` and run in a Node environment.

Existing tests cover auth, audit, admin behavior, and API routes.

## End-To-End Tests

Run Playwright headless tests with:

```bash
pnpm run test:e2e
```

Playwright configuration lives in `playwright.config.ts`. Tests live in `tests/e2e`.

The Playwright web server command currently starts the app with `npm run dev` at `http://localhost:3000`.

Use interactive UI mode only for debugging:

```bash
pnpm run test:e2e:ui
```

## Required Verification Before Final Answers

After code changes, run the relevant checks and fix failures caused by the change:

```bash
pnpm test
pnpm run test:e2e
```

For documentation-only changes, manually verify Markdown links and command examples. Full app tests are optional unless docs change executable snippets, setup flow, or test instructions.

## Test Data And Mocks

Use named mocks and fixtures from `tests/__mocks__` when possible. Avoid anonymous inline stubs for external I/O.

## Adding Tests

- New behavior should have tests.
- Bug fixes should include regression coverage.
- API changes should test success, validation failure, unauthorized, and forbidden cases when relevant.
- Frontend workflow changes should include Playwright coverage when user navigation or browser state is affected.

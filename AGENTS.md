<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Repository Instructions

These instructions apply to agents working in this repository. Prefer existing project conventions over generic defaults, and keep changes focused on the requested task.

## Next.js Guidance

- Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`.
- Treat deprecation notices as authoritative.
- Do not assume APIs, routing conventions, or file structure match older Next.js versions.

## Code Style

- Keep functions focused and short, ideally 4-20 lines. Split longer functions by responsibility.
- Keep files under 500 lines when practical. Split large files into focused modules.
- Give each function one job and each module one responsibility.
- Use specific names. Avoid vague names such as `data`, `handler`, and `Manager`.
- Prefer names that are easy to search for and unlikely to collide across the codebase.
- Use explicit types. Avoid `any`, broad dictionary types, and untyped functions.
- Avoid duplication. Extract shared behavior into a function or module.
- Prefer early returns over nested conditionals. Keep indentation shallow, with no more than two nested levels where practical.
- Include the offending value and expected shape in exception or validation messages.

## Comments And Documentation

- Preserve existing comments during refactors unless they are obsolete or misleading.
- Write comments that explain why code exists, not what the syntax does.
- Add docstrings to public functions when useful, including intent and a small usage example.
- Reference issue numbers or commit SHAs when code exists because of a specific bug, workaround, or upstream constraint.

## Tests

- Before giving a final answer after code changes, run the relevant test commands and fix any failures caused by the change.
- Run unit and integration tests with `pnpm test`.
- Run end-to-end tests in headless mode with `pnpm run test:e2e`.
- Use the Playwright UI runner, `pnpm run test:e2e:ui`, when interactive debugging is useful.
- Add tests for new behavior. Bug fixes should include regression coverage.
- Mock external I/O, such as APIs, databases, and filesystem access, with named fake classes or fixtures rather than inline anonymous stubs.
- Keep tests F.I.R.S.T.: fast, independent, repeatable, self-validating, and timely.

## Dependencies

- Inject dependencies through constructors or parameters instead of reaching through globals.
- Wrap third-party libraries behind thin project-owned interfaces when they touch core behavior or make testing harder.

## Structure

- Follow the framework's conventions unless the repository has an established local pattern.
- Prefer small, focused modules over broad "god files".
- Keep paths predictable, such as framework-standard app structure, `src/lib`, and colocated tests where appropriate.

## Formatting

- Use the language or project default formatter, such as Prettier, ESLint, `gofmt`, `black`, or `cargo fmt`.
- Do not hand-format code in ways that fight the configured formatter.

## Logging

- Use structured JSON for debugging and observability logs.
- Use plain text for user-facing CLI output.

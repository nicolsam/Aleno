# Database

## Provider

The application uses PostgreSQL through Prisma and `@prisma/adapter-pg`.

Local PostgreSQL is defined in `docker-compose.yml`:

- image: `postgres:15`
- database: `aleno`
- user: `postgres`
- password: `postgres`
- port: `5432`

## Prisma Files

- `prisma/schema.prisma`: source of truth for models and relations.
- `prisma/migrations`: committed database migrations.
- `prisma/seed.ts`: seeds reading levels.
- `prisma.config.ts`: Prisma config using `DIRECT_URL` or `DATABASE_URL`.

## Domain Model

- `School`: organization unit. Schools can have teachers, students, and classes.
- `Class`: grade, section, and shift inside a school. The combination of school, grade, section, and shift is unique.
- `Teacher`: user account with email, password hash, optional global admin flag, sessions, audit logs, and school assignments.
- `TeacherSchool`: join table that grants a teacher access to a school.
- `Student`: student profile scoped to a school and class. Student numbers are unique within a school.
- `ReadingLevel`: ordered reading level reference data.
- `StudentReadingHistory`: reading assessments recorded by a teacher for a student.
- `UserSession`: token-backed session metadata.
- `AuditLog`: admin and user activity events.

## Soft Delete

Schools, classes, and students use `deletedAt` for soft delete. Normal list queries filter these records out. Restore routes set `deletedAt` back to `null`.

## Seed Data

`prisma/seed.ts` upserts these reading levels:

- `DNI`: Does Not Identify
- `LO`: Letters Only
- `SO`: Syllables Only
- `RW`: Reads Words
- `RS`: Reads Sentences
- `RTS`: Reads Text Syllabically
- `RTF`: Reads Text Fluently

Run the seed with:

```bash
pnpm prisma db seed
```

## Development Notes

- Review migrations before committing them.
- Keep model names and API response names aligned with existing code.
- When adding required fields, update seed data, tests, forms, and API validation together.

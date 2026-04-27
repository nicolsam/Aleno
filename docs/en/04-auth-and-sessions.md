# Auth And Sessions

## Login And Register

`POST /api/auth` accepts an `action` field:

- `register`: creates a teacher, hashes the password with bcrypt, creates a session, writes an audit log, and returns a token plus teacher payload.
- `login`: verifies credentials, creates a session, writes an audit log, and returns a token plus teacher payload.

The returned teacher payload includes:

- `id`
- `name`
- `email`
- `isGlobalAdmin`

## Tokens

Tokens are JWTs signed with `JWT_SECRET` and expire after 7 days. Protected API requests use:

```text
Authorization: Bearer <token>
```

`src/lib/auth.ts` owns password hashing, password verification, token generation, and token verification.

## Frontend Storage

The dashboard stores:

- `token`: bearer token used for API requests.
- `teacher`: logged-in teacher payload.
- `selectedSchool`: current dashboard school filter.

These values live in `localStorage`.

## Heartbeat

`src/app/dashboard/layout.tsx` sends a heartbeat to `POST /api/auth/heartbeat` immediately after mounting and then every 2 minutes. The heartbeat updates session activity data.

## Admin Access

Admin API routes call `verifyAdmin` from `src/lib/admin.ts`. A request is allowed only when:

- a bearer token is present,
- the token is valid,
- the matching teacher exists,
- `teacher.isGlobalAdmin` is true.

## Audit Logs

`src/lib/audit.ts` writes audit log rows. Auth actions log `REGISTER` and `LOGIN`. When adding sensitive or administrative actions, add audit logging at the route boundary.

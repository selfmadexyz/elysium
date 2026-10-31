---
applyTo: "packages/backend/**"
paths:
  - "packages/backend/**"
---

# Backend

- Keep HTTP validation and route contracts in Elysia/TypeBox, queries and business rules in feature services, and schema in Drizzle. Preserve Eden type inference through the exported `App` type.
- Authentication uses Better Auth sessions from request headers. For restricted data, enforce access server-side using session-derived identity; test unauthenticated and forbidden identities. The shared posts example is not proof of per-user ownership.
- Assert query filters at the DB boundary when a test claims to cover scoping; a mocked service response only proves the HTTP contract.
- Preserve expected `ServerError` subclasses and status codes; unexpected errors must not disclose sensitive details in production.
- Env changes update `src/env.ts` and `.env.example`; test fixtures use isolated dummy secrets and a disposable DB. Do not read real OAuth credentials for tests.
- Schema changes include generated migrations and compatibility/rollback notes. Do not rewrite deployed migrations. Never run `db:push` on a shared database as part of a test or shipping workflow.
- Use Bun tests for backend behavior. Test the real boundary relevant to the bug; avoid suites that only assert a stub returns the value it was given.

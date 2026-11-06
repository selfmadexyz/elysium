---
applyTo: "packages/backend/**,packages/contracts/**"
paths:
  - "packages/backend/**"
  - "packages/contracts/**"
---

# Backend and contracts

- A feature module is `index.ts` (Elysia routes, TypeBox validation, per-status `response`), `service.ts` (Drizzle queries and business rules) and `model.ts` (Elysia models and backend-only schemas). No query in `index.ts`, no HTTP concern in `service.ts`.
- Request/response schemas shared with the web live in `packages/contracts/src/`; contracts depend only on `@sinclair/typebox`.
- Keep Eden inference intact through the exported `App` type: routes declare `response`, errors use the shared `'error'` model.
- A private route uses `auth: true` and takes identity from the resolved `user`. Ownership queries keep both the record ID and the `authorId` predicate; not-owned answers `NotFoundError`.
- Throw `ServerError` subclasses from `src/lib/errors.ts`; never build an error body by hand or leak an internal message on a 5xx in production.
- `ID` params are `t.Numeric` bounded to Postgres `integer` (1 – 2 147 483 647); list endpoints bound `limit` and `offset`.
- Env changes update `src/env.ts` and `.env.example` together; tests use the dummy values from `test/setup.ts`.
- Schema changes ship a generated migration in `drizzle/`; never rewrite an applied one or run `db:push` on a shared database.
- Backend tests use `bun test`. An ownership test seeds two users and asserts the other one gets 404 / no row on get, update, delete and list, against the real DB (`RUN_DATABASE_TESTS=1`).

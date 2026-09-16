# Elysium API

The backend package is an import-safe Elysia application for authentication, authorization, validation, business logic, and PostgreSQL access.

`src/app.ts` exports the application without opening a socket. TanStack Start imports that app to serve same-origin `/api/*`. `src/index.ts` is the optional standalone Bun entry point.

## Run locally

The root command prepares PostgreSQL, applies migrations, and runs the unified TanStack Start and Elysia server:

```bash
just dev
```

To run Elysia independently:

```bash
cd packages/backend
cp .env.example .env
bun run dev
```

The example database URL is a placeholder. The root [quick start](../../README.md#quick-start) provides the local container value.

## Endpoints

Through TanStack Start:

- API base: <http://localhost:3000/api>
- Health: <http://localhost:3000/api/health>
- Better Auth: <http://localhost:3000/api/auth>
- Posts example: <http://localhost:3000/api/posts>

Through the standalone server, replace port 3000 with 3001. Swagger is exposed at `/api/swagger` when `NODE_ENV` is not `production`.

## Environment

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | No | Runtime mode; defaults to development |
| `PORT` | No | No | Standalone server port; defaults to 3001 |
| `DATABASE_URL` | Yes | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Yes | Better Auth secret, at least 32 characters and not the example value |
| `BETTER_AUTH_URL` | Yes | No | Public origin serving auth routes |
| `APP_URL` | Yes | No | Allowed application origin |
| `GOOGLE_CLIENT_ID` | Yes | Configuration | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Yes | Google OAuth client secret |

Production `APP_URL` and `BETTER_AUTH_URL` values must use HTTPS unless they target localhost.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Run standalone Elysia in watch mode |
| `bun run start` | Apply migrations, then run standalone Elysia |
| `bun run test` | Run backend tests with the shared preload |
| `bun run lint` | Run TypeScript and Biome checks |
| `bun run format` | Apply Biome formatting, including unsafe fixes |
| `bun run db:migrate` | Apply committed Drizzle migrations |
| `bun run db:generate` | Generate a migration from schema changes |
| `bun run db:push` | Push the schema directly; local development only |

## Module convention

Feature modules live under `src/modules/<feature>/`:

- `index.ts`: routes and HTTP contract
- `service.ts`: business and persistence behavior
- `model.ts`: request, response, and database-derived schemas

The routes aggregator mounts modules under `/api`. The posts example scopes reads and mutations to the authenticated author.

## Tests

The current Bun tests cover:

- importing Elysia without opening a socket;
- the health and unauthenticated API paths;
- environment validation;
- owner-scoped posts service behavior;
- redaction of unexpected repository failures.

They are a foundation rather than complete application coverage. Add integration tests against PostgreSQL, auth lifecycle tests, and product-specific authorization cases.

## Database workflow

1. Edit `src/database/schema.ts`.
2. Run `bun run db:generate`.
3. Review the SQL under `drizzle/`.
4. Apply it with `bun run db:migrate`.
5. Commit the schema and migration together.

Use the one-shot migration container in deployments. Do not use `db:push` as the production migration mechanism.

See [Deployment](../../docs/deployment.md) and the [production checklist](../../docs/production-checklist.md).

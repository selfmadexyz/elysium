# Troubleshooting

## Environment validation or missing backend variables

The backend validates required values, URLs, database protocol, port and auth secret. The example secret is rejected; generate a local one with `openssl rand -base64 32`.

For the default local stack, `packages/backend/.env` needs:

```env
DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/myapp
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

Include the secret and OAuth values from the [quick start](../README.md#quick-start). OAuth placeholders allow email/password development only.

The web process embeds Elysia and needs backend configuration for API/session requests. Root `bun run dev` and `just dev-web` load `packages/backend/.env`; `just dev` also prepares the database. Production must receive these values through runtime configuration. Never expose them as `VITE_*` variables.

## PostgreSQL does not start

Check Docker and the service health:

```bash
docker compose ps postgres
docker compose logs postgres
```

Compose preserves named volume `elysium-postgres-data`. If the legacy manually managed `elysium-postgres` container is running, `just postgres-start` refuses to open another database. Back up its data, deliberately stop it with `docker stop elysium-postgres`, then rerun `just postgres-start`. Compose attaches the same volume; keep the stopped container until data is verified.

PostgreSQL 15 data cannot be attached directly to PostgreSQL 17. Preserve a backup and use dump/restore or a reviewed major-version upgrade; use a compatible server image while preparing that migration. Deleting the volume is not an upgrade.

Only if local data is disposable:

```bash
just reset-db
just postgres-start
```

`just reset-db` permanently deletes the Compose database volume. `just stop` preserves it.

## Pages work but the API fails

```bash
curl --fail http://localhost:3000/api/health
```

Check the unified process's backend environment, PostgreSQL readiness, migrations and server output. To isolate backend behavior, run `just dev-backend` and check `http://localhost:3001/api/health`; a working standalone server with a failing integrated endpoint points to the web process's environment or adapter.

Development OpenAPI lives at `/api/swagger` on either server. A 404 there in production is expected.

## Google sign-in fails

Confirm that the ID and secret belong to the same OAuth application, runtime values are present, and `APP_URL`/`BETTER_AUTH_URL` match the exact browser origin. Register `<BETTER_AUTH_URL>/api/auth/callback/google` with the provider; locally this is `http://localhost:3000/api/auth/callback/google`. Production uses HTTPS. Browser tests do not exercise a real provider exchange.

## Canonical or social URLs use localhost

Set public `VITE_SITE_URL` before `bun run build` or the image build, then rebuild. It is compiled into the artifact; changing only runtime environment cannot update generated metadata.

## Migrations fail

Run `just migrate` to see the full Drizzle error. Check the URL, readiness, permissions and committed SQL under `packages/backend/drizzle/`.

If migration 0002 finds unowned posts, use the [reviewed backfill procedure](deployment.md#existing-posts-and-migration-0002). Do not bypass its guard, invent owners or delete rows to make deployment pass. Generate migrations with `just generate-migration` after schema edits; reserve `db:push` for disposable local development.

## Tests fail before running

Ordinary backend tests skip database integration cases. To create a disposable `elysium_test` database, migrate it, run integration tests and remove the container:

```bash
just test-integration
```

It uses host port `55434`. Override an occupied port with `TEST_POSTGRES_PORT=55435 just test-integration`. With `RUN_DATABASE_TESTS=1`, tests refuse databases not named exactly `elysium_test`. The preload supplies deterministic test configuration without overwriting a CI-supplied database URL.

Browser tests need a build, Chromium and a migrated disposable database:

```bash
bun run build
bunx playwright install chromium
E2E_DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/elysium_test bun run test:e2e
```

Create/migrate that test database separately; `just dev` prepares `myapp`, and `just test-integration` removes its own container afterward. E2E fixtures allow only `elysium_test` or `elysium_e2e`. See `playwright.config.ts` for the server's isolated test environment.

## Port conflicts

Defaults are web `3000`, standalone development API `3001`, local PostgreSQL `5434` and integration PostgreSQL `55434`. `POSTGRES_PORT` changes the Compose host port; update the backend database URL accordingly. `TEST_POSTGRES_PORT` changes integration-test mapping.

If you change the public web origin, also update `APP_URL`, `BETTER_AUTH_URL`, build-time `VITE_SITE_URL` and the registered OAuth callback.

# Troubleshooting

## The backend rejects the environment file

The backend validates URLs, the database protocol, the port, required OAuth values, and the auth secret. The public placeholder secret is deliberately rejected.

Generate and store a real local secret:

```bash
openssl rand -base64 32
```

For the database created by `just dev`, use:

```env
DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/myapp
```

For same-origin local auth, use:

```env
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

## The web server reports missing backend variables

TanStack Start imports Elysia for `/api/*` and protected route loaders. The web process therefore needs the backend environment in addition to `packages/web/.env`.

The root `dev:web` script loads `packages/backend/.env` before TanStack Start starts. Create that file first, then use:

```bash
just dev
```

Use the platform's runtime secret configuration in production. Do not expose backend secrets as `VITE_*` values.

## PostgreSQL does not start

Confirm Docker is running:

```bash
docker compose ps postgres
```

Inspect the service logs when its health check fails:

```bash
docker compose logs postgres
```

`just postgres-start` waits for the Compose health check. If an old local database is incompatible and its data is disposable:

```bash
just reset-db
just postgres-start
```

`just reset-db` permanently removes the Compose project and its named volume.

## The web page works but `/api/*` fails

Test the embedded handler:

```bash
curl --fail http://localhost:3000/api/health
```

Then test standalone Elysia:

```bash
curl --fail http://localhost:3001/api/health
```

If port 3001 works and port 3000 fails, check the environment inherited by the TanStack Start process. If both fail, check PostgreSQL, migrations, and the backend startup output.

## Google sign-in fails

Confirm:

- client ID and secret belong to the same OAuth application;
- `BETTER_AUTH_URL` and `APP_URL` are the exact browser origin;
- the registered callback is `<BETTER_AUTH_URL>/api/auth/callback/google`;
- production uses HTTPS;
- the web runtime received the OAuth variables.

The local callback is:

```text
http://localhost:3000/api/auth/callback/google
```

## Canonical or social URLs use localhost

`VITE_SITE_URL` is build-time configuration. Set it to the public HTTPS origin before `bun run build` or the container build, then rebuild the web artifact.

## Swagger returns 404

Swagger is available when `NODE_ENV` is not `production`:

```text
http://localhost:3000/api/swagger
```

The standalone equivalent is <http://localhost:3001/api/swagger>. Swagger is intentionally absent in production.

## Migrations fail

Expose the Drizzle error directly:

```bash
just migrate
```

Check `DATABASE_URL`, database readiness, user permissions, and the committed files under `packages/backend/drizzle/`.

Use `just generate-migration` after schema edits. Use `db:push` only for local development.

## Tests fail before running

Backend tests preload deterministic test environment values. Some future integration tests may also require the local PostgreSQL service. Run:

```bash
just postgres-start
just migrate
just test
```

## Ports are already in use

Defaults:

- TanStack Start: `3000`
- standalone Elysia: `3001`
- PostgreSQL host port: `5434`

Changing the public web port also requires updating `APP_URL`, `BETTER_AUTH_URL`, `VITE_SITE_URL`, and the OAuth callback.

# Elysium

A Bun-first TypeScript starter with React 19, TanStack Start/Query/Form, Elysia, Better Auth, Drizzle and PostgreSQL. Public pages generate HTML for SEO; private screens can stay client-rendered. One server serves the web application and `/api/*` on the same origin.

The posts example provides authenticated, owner-scoped CRUD. Replace its domain and branding for your product; tenant permissions, email delivery, abuse controls and production operations remain application work.

## Quick start

Install [Bun 1.4.4](https://bun.sh/), [Docker with Compose v2](https://docs.docker.com/get-docker/), [just](https://github.com/casey/just) and OpenSSL, then start Docker.

```bash
git clone https://github.com/selfmadexyz/elysium.git
cd elysium
just install
bun run hooks
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env
openssl rand -base64 32
```

Put the generated secret and local connection values in `packages/backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/myapp
BETTER_AUTH_SECRET=<generated value>
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

The example secret is rejected. OAuth placeholders allow email/password development; Google sign-in needs real provider credentials and this registered callback:

```text
http://localhost:3000/api/auth/callback/google
```

Set the public canonical origin in `packages/web/.env`:

```env
VITE_SITE_URL=http://localhost:3000
```

```bash
just dev
curl --fail http://localhost:3000/api/health
```

`just dev` starts PostgreSQL, waits for readiness, applies committed migrations and runs one TanStack Start/Elysia process with the backend environment. Open <http://localhost:3000>; development API documentation is at <http://localhost:3000/api/swagger>.

`just stop` stops PostgreSQL without deleting its named volume. `just reset-db` permanently deletes the local database. For existing installations, read the [database compatibility notes](docs/troubleshooting.md#postgresql-does-not-start) before resetting or upgrading.

## Boundaries and structure

```text
Browser → TanStack Start pages + /api adapter → Elysia → Drizzle → PostgreSQL
                                                └── Better Auth
```

| Location | Responsibility |
| --- | --- |
| `packages/web/src/routes/` | File routes, page UI, metadata and API adapter |
| `packages/web/src/router.tsx` | A new router and QueryClient per invocation |
| `packages/web/src/lib/` | Same-origin Eden/auth clients, server session helper and SEO |
| `packages/web/src/hooks/` | TanStack Query data access |
| `packages/backend/src/app.ts` | Import-safe Elysia application, no listening socket |
| `packages/backend/src/modules/` | HTTP routes (`index.ts`), business/database services and models |
| `packages/backend/drizzle/` | Committed schema migrations |
| `packages/contracts/src/` | Browser-safe TypeBox request/response schemas and DTOs |

Start owns documents, routing, rendering, hydration and web-specific session adapters. Elysia owns API authentication, authorization, validation, business rules and persistence. Eden shares the API contract with React; runtime validation and authorization still happen on the server. The posts services derive ownership from the session for every read and mutation.

Public `/` and `/get-started` pages are explicitly pre-rendered. `/posts` stays client-rendered behind an authentication guard. Request sessions and query caches must remain isolated, and personalized responses use `no-store`. See [rendering choices](docs/rendering.md) for SSR, generated pages and SPA mode.

The default production process embeds Elysia in the web server. `packages/backend/src/index.ts` remains available on port 3001 for isolated local backend development.

## Commands

Run `just` for all recipes. Root package scripts use Bun; install from the committed lockfile.

| Command | Purpose |
| --- | --- |
| `just dev` | Prepare PostgreSQL, migrate and run the application |
| `just dev-web` | Run the application without preparing PostgreSQL |
| `just dev-backend` | Run standalone Elysia for local development |
| `bun run lint` / `bun run typecheck` | Biome and workspace type checks |
| `bun run lint:comments` | Review added comments and reject review annotations |
| `just test` | Harness, backend and web unit tests |
| `just test-integration` | Backend integration tests in disposable PostgreSQL |
| `just build` | Build the Start/Nitro server under Bun and type-check web |
| `just generate-migration` / `just migrate` | Generate or apply Drizzle migrations |
| `just migration-image` / `just run-migration-image` | Build or locally run the migration image |
| `bun run audit` | Check production dependency advisories |

For browser tests, build first, install Chromium with `bunx playwright install chromium`, then run `bun run test:e2e`. Set `E2E_DATABASE_URL` to a migrated disposable database named `elysium_test` or `elysium_e2e`; fixtures refuse other names. Coverage includes public HTML/metadata, hydration, auth guards, session renewal and paginated CRUD. Real Google OAuth still needs provider configuration.

After schema edits, generate and review SQL, then commit schema and migration together. Never rewrite applied migrations or use `db:push` against shared databases. [Migration 0002](docs/deployment.md#existing-posts-and-migration-0002) needs a reviewed ownership backfill for existing posts.

## Configuration

Backend variables are server runtime configuration, including for the integrated web process:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL; secret |
| `BETTER_AUTH_SECRET` | Unique secret, at least 32 characters |
| `BETTER_AUTH_URL` | Public origin serving `/api/auth/*` |
| `APP_URL` | Allowed application origin |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | OAuth application configuration and secret |
| `NODE_ENV` | Runtime mode; defaults to development |
| `PORT` | Standalone API port; defaults to 3001 |
| `EMAIL_TRANSPORT` | `console` (default outside production) logs emails; `resend` (production default) sends them |
| `EMAIL_FROM`, `RESEND_API_KEY` | Sender such as `App <no-reply@your-domain>` and Resend API key; key is a secret |
| `LOG_LEVEL` | `debug`, `info` (default), `warn` or `error` |
| `OTEL_SERVICE_NAME` | `service.name` attached to exported logs; defaults to `elysium` |
| `BETTER_STACK_SOURCE_TOKEN`, `BETTER_STACK_INGESTING_HOST` | Optional Better Stack OpenTelemetry source; token is a secret |

Production non-local auth/application origins require HTTPS. `VITE_SITE_URL` is public **build-time** configuration for canonical and social URLs; changing it requires a rebuild. Every `VITE_*` value reaches the browser: keep database and auth secrets in runtime configuration. Public pre-render builds do not need a database or backend secrets, while API and session requests do.

## Email

Email/password accounts must verify their address before they can log in. Sign-up sends a verification link, logging in with an unverified address sends a new one, and opening the link signs the user in. `/forgot-password` sends a reset link to `/reset-password`; a reset revokes the user's other sessions. Links expire after one hour. Google accounts arrive verified.

In development, `EMAIL_TRANSPORT=console` prints each message and its link in the server log. In production, verify a sending domain in [Resend](https://resend.com/domains), create an API key with sending access, then set `EMAIL_FROM` and `RESEND_API_KEY`; startup fails if they are missing. Messages are sent after the auth response and delivery failures are logged as errors. Templates live in `packages/backend/src/modules/auth/emails.ts`.

Existing email/password users created before verification was required will receive a verification link on their next log-in attempt.

## Logs and errors

`@backend/lib/logger` writes structured logs: readable lines in development, JSON lines on stdout/stderr in production. Every API request is logged with its method, route pattern, status and duration; query strings and raw paths are never logged because auth links carry tokens. Unexpected errors (5xx and unknown codes) and uncaught exceptions are logged with `exception.type`, `exception.message`, `exception.stacktrace` and `exception.cause`.

When both Better Stack variables are set, the same records are also exported over OTLP/HTTP to `https://<ingesting host>/v1/logs`. In Better Stack, create a source with the **OpenTelemetry** platform, then copy its source token and ingesting host. Filter on `level = ERROR` (or `severity_text`) for errors and create an alert on that query. Export is disabled in tests. Never log request bodies, cookies, tokens or credentials.

## Dependencies and production

Keep the pinned Bun and coupled TanStack/Vite/Tailwind/Better Auth stack aligned when upgrading. Validate types, tests, build, production advisories and containers. Root overrides select patched transitive releases; the `esbuild` override exceeds Drizzle Kit's declared range and should be removed when upstream accepts a patched compatible release. Verify `bun run db:generate` when changing it.

Before deploying, replace sample content and social artwork, define product authorization and recovery policies, and configure backups, observability and abuse protection. Nitro 3 currently uses a beta release. There is no configured staging/production deployment target.

- [Deployment and migration safety](docs/deployment.md)
- [Rendering and SEO](docs/rendering.md)
- [Troubleshooting](docs/troubleshooting.md)
- [AI harness, reviews and CI](docs/ai-harness.md)

## License

[MIT](LICENSE)

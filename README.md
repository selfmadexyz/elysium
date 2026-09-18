# Elysium

An opinionated, Bun-first starter for authenticated TypeScript products. Elysium combines TanStack Start, Elysia, Better Auth, Drizzle, and PostgreSQL behind one public origin, with shared types from the database to React.

It is designed for dashboards, internal tools, and SaaS applications that need SSR for public pages and a separate business API boundary without starting from a large framework preset.

> [!IMPORTANT]
> Elysium is a starter and reference implementation. It is not production-ready by default. Replace the sample domain, adapt its authorization model, and complete the [production checklist](docs/production-checklist.md) before shipping.

## What is included

- Bun 1.4.2 workspaces and TypeScript strict mode
- TanStack Start with React 19, SSR, file-based routing, and route metadata
- TanStack Query and TanStack Form
- Elysia mounted under the same-origin `/api/*` route
- Eden Treaty for the typed API client
- Better Auth with email/password and Google OAuth
- PostgreSQL, Drizzle ORM, and generated TypeBox schemas
- Tailwind CSS 4 and shadcn/ui components built on Base UI
- Authenticated, owner-scoped posts CRUD as an integration example
- Backend tests, CI verification, and separate web, API, and migration images

## Architecture

```text
Browser ── http://localhost:3000
              │
              ├── pages, SSR, metadata ── TanStack Start
              └── /api/* ─────────────── Elysia
                                            ├── Better Auth
                                            ├── feature modules
                                            └── Drizzle ── PostgreSQL :5434
```

The browser uses one origin for pages, authentication, and API requests. TanStack Start imports the Elysia application as an in-process request handler. Elysia can also run independently on port 3001 for isolated backend development.

Read [Architecture](docs/architecture.md) for ownership rules, request flows, and supported deployment shapes.

## Prerequisites

- [Bun 1.4.2](https://bun.sh/)
- [Docker](https://docs.docker.com/get-docker/) with the daemon running
- [just](https://github.com/casey/just)
- OpenSSL for generating the local auth secret

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/selfmadexyz/elysium.git
cd elysium
just install
```

`just install` uses the committed lockfile.

### 2. Create local environment files

```bash
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env
```

Generate an auth secret:

```bash
openssl rand -base64 32
```

Configure the backend for the local PostgreSQL container and same-origin web server:

```env
# packages/backend/.env
PORT=3001
DATABASE_URL=postgresql://postgres:localpassword@localhost:5434/myapp
BETTER_AUTH_SECRET=<paste the generated value>
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Configure the canonical public origin:

```env
# packages/web/.env
VITE_SITE_URL=http://localhost:3000
```

The backend rejects the example auth secret. Google values must be present; placeholders are sufficient for email/password development, while Google sign-in requires real credentials.

### 3. Start the stack

The root development script loads `packages/backend/.env` into the unified TanStack Start and Elysia process:

```bash
just dev
```

`just dev` starts PostgreSQL, waits until it is ready, applies migrations, and runs the unified TanStack Start and Elysia development server.

Open <http://localhost:3000>. Verify the same-origin API:

```bash
curl --fail http://localhost:3000/api/health
```

Swagger is available at <http://localhost:3000/api/swagger> outside production. Run `just dev-backend` separately only when you need the standalone Elysia server on port 3001.

### 4. Stop or reset PostgreSQL

```bash
just stop
```

`just reset-db` removes the PostgreSQL container and named volume. It permanently deletes the local database.

## Commands

Run `just` to list the available recipes.

| Command | Effect |
| --- | --- |
| `just install` | Install exactly the dependencies in `bun.lock` |
| `just dev` / `just start` | Prepare PostgreSQL, migrate, and run the unified Start/Elysia server |
| `just dev-web` | Run the unified Start/Elysia server without preparing PostgreSQL |
| `just dev-backend` | Run only the standalone Elysia server |
| `just check` | Run lint, type checks, tests, and production builds |
| `just lint` | Run repository type and Biome checks |
| `just test` | Run all workspace test scripts |
| `just test-integration` | Run backend database tests in an isolated, ephemeral PostgreSQL container |
| `just build` | Build Elysia and the TanStack Start server |
| `just migrate` | Apply committed migrations to the local container database |
| `just generate-migration` | Generate a Drizzle migration |
| `just postgres-url` | Print the local container connection string |
| `just stop` | Stop local PostgreSQL |
| `just reset-db` | Remove local PostgreSQL and its named volume |
| `just migration-image` | Build the one-shot migration image |
| `just run-migration-image` | Run the migration image with the backend env file |

Equivalent root package scripts include `bun run dev`, `build`, `typecheck`, `lint`, `test`, `db:migrate`, `db:generate`, and `audit`.

## Dependency policy

The coupled build stack is pinned deliberately: Bun, TanStack Start/Router/Query, Vite, Tailwind, and Better Auth should be upgraded together and validated with `just check` plus the container build. Root overrides currently select patched transitive releases reported by `bun audit`.

The `esbuild` override is newer than the range declared by Drizzle Kit. Keep it only while `bun run db:generate`, tests, and production builds pass; remove it when Drizzle publishes a compatible patched range. Do not update the lockfile without rerunning `bun audit`.

## Environment variables

### Server runtime

These values are needed by standalone Elysia and by the TanStack Start process that serves `/api/*`.

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `NODE_ENV` | No | No | `development`, `test`, or `production`; defaults to development |
| `PORT` | No | No | Standalone Elysia port; defaults to 3001 |
| `DATABASE_URL` | Yes | Yes | PostgreSQL URL |
| `BETTER_AUTH_SECRET` | Yes | Yes | Better Auth secret, at least 32 characters |
| `BETTER_AUTH_URL` | Yes | No | Public origin serving `/api/auth/*` |
| `APP_URL` | Yes | No | Allowed application origin |
| `GOOGLE_CLIENT_ID` | Yes | Configuration | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Yes | Google OAuth client secret |

Non-local production values for `APP_URL` and `BETTER_AUTH_URL` must use HTTPS.

### Web build

| Variable | Required | Public | Purpose |
| --- | --- | --- | --- |
| `VITE_SITE_URL` | No | Yes | Canonical and Open Graph origin; defaults to `http://localhost:3000` |

Every `VITE_*` value is embedded in the build. Never put a secret in one.

For Google OAuth locally, register:

```text
http://localhost:3000/api/auth/callback/google
```

## Repository layout

```text
packages/
├── backend/
│   ├── drizzle/             committed migrations
│   ├── test/                API, environment, and service tests
│   └── src/
│       ├── app.ts           import-safe Elysia application
│       ├── index.ts         standalone server entry point
│       ├── database/        Drizzle schema and utilities
│       ├── modules/         auth, health, and posts features
│       └── routes/          composition under /api
└── web/
    └── src/
        ├── routes/          TanStack Start routes and server handlers
        ├── pages/           page components
        ├── components/      product and UI components
        ├── hooks/           query and mutation hooks
        └── lib/             auth, API client, SEO, and validation
```

## Design boundaries

- TanStack Start owns documents, SSR, routing, metadata, hydration, and the browser boundary.
- Elysia owns `/api/*`, authentication, authorization, business rules, validation, and database access.
- Drizzle migrations are committed and applied as an explicit release step.
- Eden Treaty shares the Elysia contract with the web package; it does not replace runtime validation or authorization.
- The posts module demonstrates integration and per-user ownership. It is expected to be replaced.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [Production checklist](docs/production-checklist.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Web package](packages/web/README.md)
- [Backend package](packages/backend/README.md)

## Current limits

- No web component, auth lifecycle, or browser end-to-end tests are committed yet.
- Distributed rate limiting, audit logging, email delivery, background jobs, and production observability are not included.
- Tenant isolation and product-specific permissions remain application work.
- The included social image is the project logo rather than a dedicated preview card.
- Nitro 3 is currently consumed from its beta channel, and Rolldown emits non-blocking `use client` warnings for TanStack Router and Base UI during builds.
- Backup policy, restore testing, deployment topology, and incident response remain the adopter's responsibility.

## License

[MIT](LICENSE)

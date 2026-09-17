# Deployment

The recommended production shape is the TanStack Start web image serving pages and the embedded Elysia `/api/*` handler on one origin, plus managed PostgreSQL and a one-shot migration job.

## Published images

CI builds three container targets after lint, tests, and builds pass:

- `elysium-web`: TanStack Start/Nitro server on port 3000;
- `elysium-backend`: optional standalone Elysia binary on port 3001;
- `elysium-migrate`: one-shot Drizzle migration runner.

Images are pushed to GHCR for `main` pushes. The repository variable `PUBLIC_APP_URL` is required for production image publication and is passed to the web build as `VITE_SITE_URL`.

## Web build configuration

Canonical and social URLs are compiled into the web artifact:

```env
VITE_SITE_URL=https://app.example.com
```

Build again when the public origin changes.

## Existing posts and migration 0002

Migration `0002_add_post_ownership.sql` makes every post belong to an authenticated user. It deliberately stops if the database already contains posts with no owner; it does not guess ownership or delete data.

Before applying it to a database with existing posts:

1. take and verify a backup;
2. add the nullable `author_id` column if it is not already present;
3. map every existing post to the correct user and backfill `author_id`;
4. rerun the committed migration, which adds the foreign key, index, and `NOT NULL` constraint.

The starter migration runs directly on a fresh or empty starter database. Define a product-specific mapping before using it on real data.

## Web runtime configuration

The web server embeds Elysia, so it needs backend runtime values:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<unique value with at least 32 characters>
BETTER_AUTH_URL=https://app.example.com
APP_URL=https://app.example.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

The container already sets `HOST=0.0.0.0`, `PORT=3000`, and `NODE_ENV=production`; platform configuration can override runtime values where supported.

Register the production Google callback:

```text
https://app.example.com/api/auth/callback/google
```

## Release sequence

1. Build immutable images from a reviewed commit.
2. Back up the database according to the restore policy.
3. Run the migration image once with production backend environment values.
4. Deploy the web image with the same release version.
5. Route HTTPS traffic to port 3000.
6. Check the page, `/api/health`, auth lifecycle, a protected read, and a protected mutation.
7. Monitor errors and latency before completing the rollout.

Do not let every application replica run migrations. One release job should own schema changes.

## Local migration image

```bash
just migration-image
just run-migration-image
```

The second command reads `packages/backend/.env`. Review it before running the image against any database.

## Optional standalone API

Deploy `elysium-backend` only when the platform deliberately splits web and API services. Keep a single public origin by routing `/api/*` at the load balancer or reverse proxy. Set:

```env
PORT=3001
BETTER_AUTH_URL=https://app.example.com
APP_URL=https://app.example.com
```

Swagger is disabled automatically when `NODE_ENV=production`.

## Platform requirements

- HTTPS on the public origin
- PostgreSQL TLS, backups, point-in-time recovery, and tested restores
- managed secrets rather than committed env files
- least-privilege database roles for applications and migrations
- logs with secret and personal-data redaction
- availability, latency, error, and database-capacity monitoring
- resource limits and graceful shutdown handling
- an explicit rollback or roll-forward procedure

## Static assets and caching

The Bun Nitro server owns SSR documents and static files. Elysia remains the in-process handler for `/api/*`; it does not serve an SPA fallback or a shared `index.html`.

| Response | Cache policy |
| --- | --- |
| SSR HTML | `no-store` |
| `/api/*` | `no-store` |
| Fingerprinted `/assets/*` | public, one year, immutable |
| Manifest | public, one hour, stale for one day while revalidating |
| Icons | public, one day, stale for one week while revalidating |
| `robots.txt` and `sitemap.xml` | public, one hour, stale for one day while revalidating |

Keep personalized HTML and API responses out of browser and shared caches. Add longer caching to a public SSR route only when its data, invalidation behavior, and CDN policy are explicitly designed for it.

## Smoke checks

```bash
curl --fail https://app.example.com/
curl --fail https://app.example.com/api/health
curl --fail https://app.example.com/robots.txt
curl --fail https://app.example.com/sitemap.xml
```

Also verify the generated HTML metadata, OAuth callback, session persistence, logout, protected-route redirects, and one representative product workflow.

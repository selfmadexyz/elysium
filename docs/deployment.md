# Deployment

Run one TanStack Start/Nitro web service with its embedded Elysia `/api/*` handler, PostgreSQL and one separate migration job. Keep pages, API, auth and callbacks on the same public origin.

## Images and configuration

`packages/web/Dockerfile` provides two targets:

| Image | Purpose |
| --- | --- |
| `elysium-web` | Bun web/API server, non-root user, port 3000 |
| `elysium-migrate` | One-shot Drizzle migration runner |

CI builds and smokes both images after all five validation jobs pass, then publishes the exact saved/tested artifacts only on `main` pushes. Production publication requires repository variable `PUBLIC_APP_URL`, passed to the build as `VITE_SITE_URL`. [Harness documentation](ai-harness.md#ci-and-image-publication) describes the gates and external GitHub setup; image publication does not deploy an application.

Canonical and social URLs are compiled into the web artifact:

```env
VITE_SITE_URL=https://app.example.com
```

Rebuild when this origin changes. Public-page builds need no database or auth secrets. Supply these values to the **web runtime**:

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<unique value with at least 32 characters>
BETTER_AUTH_URL=https://app.example.com
APP_URL=https://app.example.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
EMAIL_FROM=App <no-reply@app.example.com>
RESEND_API_KEY=...
# Optional: export logs and errors to Better Stack
BETTER_STACK_SOURCE_TOKEN=...
BETTER_STACK_INGESTING_HOST=...
```

`EMAIL_FROM` must use a domain verified in Resend. Set `EMAIL_TRANSPORT=console` only for disposable smoke environments that must not send mail.

The web image sets `HOST=0.0.0.0`, `PORT=3000` and `NODE_ENV=production`. Backend secrets must never enter `VITE_*` variables, build arguments or browser imports. Register the exact Google callback `https://app.example.com/api/auth/callback/google`; automated email/password fixtures do not verify real OAuth.

## Release sequence

1. Build immutable images from a reviewed commit and record their digests.
2. Verify the database backup and review migration compatibility.
3. Run the migration image once with production backend environment values.
4. Deploy the matching web image and route HTTPS traffic to port 3000.
5. Check public HTML/metadata, `/api/health`, session persistence/renewal, logout, a protected read and mutation, and the real OAuth callback if enabled.

Migrations belong to one release job, not every application replica. Use managed secrets, database TLS and least-privilege roles. Configure restore testing, log redaction, monitoring, resource limits and a rollback or forward-fix procedure for your platform. Verify secure cookies and trusted origins through the actual HTTPS proxy.

## Existing posts and migration 0002

`0002_add_post_ownership.sql` deliberately stops if existing posts have no owner. It does not infer ownership or delete data.

Before applying it to a database containing posts:

1. take and verify a backup;
2. add nullable `author_id` if the column is absent;
3. review a mapping to real authentication users and backfill every post;
4. rerun the committed migration to install the foreign key, index and `NOT NULL` constraint.

Fresh or empty databases migrate directly. Never rewrite an applied migration or use `db:push` on a shared database.

Treat this ownership rollout as forward-only unless a rollback is reviewed with the data owner. Old code cannot insert posts after `author_id` becomes required; restoring its shared-post authorization exposes data across users. Prefer a compatible forward fix. Otherwise coordinate compatible code with a reviewed inverse migration or restore a verified backup; reverting code alone is insufficient.

## Running the migration image

For local Compose PostgreSQL:

```bash
just migration-image
just run-migration-image
```

The second command starts local PostgreSQL and runs migrations on the Compose network using hostname `postgres`. It targets local `myapp`, does not load production credentials, and accepts `POSTGRES_PORT=<port>` for the published host port.

For a managed production database, run the same release image with a reviewed environment whose database URL is reachable from the container:

```bash
docker run --rm --env-file /secure/path/production.env elysium-migrate:<release>
```

## Rate limits and migration 0003

`0003_add_rate_limit.sql` adds the `rate_limit` table; it is additive and safe to apply before the matching web image. Better Auth stores one counter per client IP and auth path there, so limits survive restarts and are shared by every replica. Defaults: 100 auth requests per minute per client, the stricter Better Auth rules for sign-in/sign-up, and three password-reset, verification-email or account-deletion requests per minute.

The client IP comes from `X-Forwarded-For`. Deploy behind a proxy that overwrites that header, or set `advanced.ipAddress.ipAddressHeaders`/`trustedProxies` in `packages/backend/src/modules/auth/auth.ts` for your platform; otherwise clients can spoof it to bypass limits. To roll back, deploy code using `storage: 'memory'` first, then drop the table.

## HTTP and caching

The web server handles generated pages, SSR, assets and API forwarding. Elysia handles API/auth; it does not serve a generic SPA fallback. Development `/api/swagger` documentation is disabled in production.

| Response | Cache policy |
| --- | --- |
| SSR HTML and `/api/*` | `no-store` |
| Fingerprinted `/assets/*` | Public, one year, immutable |
| Manifest, `robots.txt`, `sitemap.xml` | Public, one hour; stale for one day while revalidating |
| Icons | Public, one day; stale for one week while revalidating |

Keep personalized HTML and API responses out of shared caches. Longer caching for a public server-rendered route needs an explicit invalidation policy. Build-generated public pages remain at their build version until rebuilt; see [rendering](rendering.md).

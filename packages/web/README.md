# Elysium web

The web package is a TanStack Start application running on React 19 and Bun. It pre-renders its public landing/setup pages, defines route-specific metadata, supports client-rendered application routes, and exposes Elysia through same-origin `/api/*` handlers. See [rendering choices](../../docs/rendering.md) for static pages, optional SSR and SPA mode.

## Run locally

Use the root [quick start](../../README.md#quick-start) for the full stack. From the repository root, start the unified server without preparing PostgreSQL with:

```bash
just dev-web
```

The root script loads `packages/backend/.env` before starting this package. The server listens on <http://localhost:3000>.

## Environment

```env
VITE_SITE_URL=http://localhost:3000
```

`VITE_SITE_URL` sets canonical and Open Graph URLs at build time. It is public configuration. The server also requires the backend runtime variables listed in the [root README](../../README.md#server-runtime) to serve `/api/*`, sessions, and authenticated route loaders.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start TanStack Start on port 3000 |
| `bun run build` | Build under Bun, pre-render the public page allowlist, and type-check the package |
| `bun run start` | Run the built `.output/server/index.mjs` server |
| `bun run preview` | Preview the Vite build |
| `bun run test` | Run the redirect-validation and SEO helper tests with Vitest |
| `bun run lint` | Run TypeScript and Biome checks |
| `bun run format` | Apply Biome formatting, including unsafe fixes |

## Request boundaries

- `src/routes/__root.tsx` owns the HTML document, default SEO, theme, and error boundaries.
- `/` and `/get-started` generate static HTML during the build, including canonical and social metadata. Route discovery and crawling are disabled for this allowlist.
- `src/routes/api.$.ts` forwards same-origin API methods to the import-safe Elysia app.
- `src/lib/auth-server.ts` resolves sessions in server route guards and forwards refreshed session cookies to the browser.
- Protected routes resolve the session before rendering; the posts UI remains client-rendered.
- `robots.txt` and `sitemap.xml` are server routes.

## Structure

- `src/routes/`: file-based TanStack Start routes and server handlers
- `src/pages/`: route page components
- `src/components/`: product components and local UI primitives
- `src/hooks/`: query and mutation hooks
- `src/lib/client.ts`: same-origin Eden Treaty client
- `src/lib/auth.ts`: same-origin Better Auth browser client
- `src/lib/seo.ts`: canonical and social metadata helper
- `src/router.tsx`: router and SSR Query integration

## Production notes

- Build with the final public `VITE_SITE_URL`; changing it requires a rebuild.
- Pass the backend secrets and database URL to the web runtime, not to the client build.
- The web image runs as the non-root `bun` user on port 3000.
- The current Open Graph image is the project logo; replace it with a dedicated social card.
- From the repository root, `bun run test:e2e` checks generated public HTML, metadata without JavaScript, hydration, auth guards, real session renewal and paginated CRUD. Build first, install Chromium and set `E2E_DATABASE_URL` to a migrated disposable `elysium_test` or `elysium_e2e` database. Fixtures reject other database names.
- Browser coverage uses dummy email/password users and does not exercise a real Google OAuth exchange.

See [Deployment](../../docs/deployment.md) and the [production checklist](../../docs/production-checklist.md).

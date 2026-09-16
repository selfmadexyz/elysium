# Elysium web

The web package is a TanStack Start application running on React 19 and Bun. It renders public pages on the server, defines route-specific metadata, hydrates TanStack Query, and exposes the Elysia application through same-origin `/api/*` handlers.

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
| `bun run build` | Build the Nitro Bun server and type-check the package |
| `bun run start` | Run the built `.output/server/index.mjs` server |
| `bun run preview` | Preview the Vite build |
| `bun run test` | Run Vitest; currently passes when no web tests exist |
| `bun run lint` | Run TypeScript and Biome checks |
| `bun run format` | Apply Biome formatting, including unsafe fixes |

## Request boundaries

- `src/routes/__root.tsx` owns the HTML document, default SEO, theme, and error boundaries.
- Public routes render on the server and can define canonical and social metadata.
- `src/routes/api.$.ts` forwards same-origin API methods to the import-safe Elysia app.
- `src/lib/auth-server.ts` resolves sessions in server route guards.
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
- Add web component and browser end-to-end tests before treating the starter as a release baseline.

See [Deployment](../../docs/deployment.md) and the [production checklist](../../docs/production-checklist.md).

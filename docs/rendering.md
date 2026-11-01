# Rendering and API boundaries

Elysium uses TanStack Start for the web application and Elysia for the API, authentication, permissions and business logic. Browser data access uses the same-origin Eden client and TanStack Query. Rendering choices do not replace API authorization.

## Starter defaults

| Route | Rendering | Reason |
| --- | --- | --- |
| `/` and `/get-started` | HTML generated during the production build | Public content and route-specific SEO/Open Graph metadata are available before JavaScript runs |
| `/posts` | Client-rendered after its authentication guard | Private interactive data has no indexing requirement |
| Sign-in and sign-up | Request-rendered public form | These pages remain outside the static page allowlist |

The `tanstackStart` configuration explicitly pre-renders only `/` and `/get-started`. Automatic route discovery and link crawling are disabled, so adding a protected route cannot accidentally include it in static output. Keep user-specific data out of pre-rendered pages and their loaders.

The root document and public pages do not read the visitor's session. The protected parent route reads the current request's session; the server helper forwards Better Auth's renewed cookies to the response. Each router owns its QueryClient. Private responses keep `Cache-Control: no-store`.

## Choose a mode for a new page

- Set `ssr: false` on a route for a browser-rendered page. This also moves that route's `beforeLoad` and `loader` to the browser; enforce permissions in Elysia regardless of the client guard.
- Set `ssr: true` for content that must be rendered on the initial server request. Add route-specific `head` metadata and fetch request-scoped data without sharing another visitor's cache or session.
- Add an explicitly public path to the Vite `pages` allowlist to generate its HTML at build time. Its content stays at that build's version until the next build.
- Use `ssr: 'data-only'` when a route needs server-side loading without rendering its component on the server.

Start defaults to SSR for a route without an explicit override. The examples make their choices explicit; SSR is not a requirement for application pages.

## A project that only needs a SPA

TanStack Start supports `spa: { enabled: true }` in its Vite plugin configuration. Remove this starter's explicit `prerender`/`pages` configuration when switching to a plain SPA shell. The API still needs a Bun server: serving the frontend from a static CDN does not host Elysia, authentication or PostgreSQL access.

If pages need search indexing or link previews, keep their metadata and content in generated HTML or server responses. Browser-only meta changes are insufficient for crawlers that do not execute JavaScript. The shared SEO helper provides titles, descriptions, canonical URLs, Open Graph and Twitter tags.

## Backend ownership

Keep CRUD and complex workflows in Elysia services rather than duplicating them in Start server functions. Start's server functions should adapt web-specific concerns such as request sessions or SSR data loading. The default deployment runs the built Start/Nitro server and its embedded Elysia `/api` handler on one origin, plus PostgreSQL and a separate one-shot migration job.

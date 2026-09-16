# Architecture

Elysium combines a server-rendered web application with an explicit Elysia business API. The browser sees one public origin even though Elysia remains independently runnable and testable.

## Runtime shape

```text
Browser ── https://app.example.com
                  │
                  ├── /* ───────── pages, assets, SSR ── TanStack Start
                  │
                  └── /api/* ───── route adapter ─────── Elysia
                                                         ├── Better Auth
                                                         ├── feature modules
                                                         └── Drizzle ── PostgreSQL
```

The `/api/$` TanStack Start server route imports the Elysia app and passes it the incoming `Request`. Elysia is defined in `packages/backend/src/app.ts` without calling `listen`, so importing it does not open another socket.

`packages/backend/src/index.ts` provides a standalone port 3001 process for isolated backend development and deployments that deliberately put a reverse proxy in front of separate services.

## Ownership

### TanStack Start owns

- the HTML document, SSR, hydration, and navigation;
- public and protected page routes;
- page titles, descriptions, canonical URLs, and social metadata;
- `robots.txt` and `sitemap.xml`;
- server-side session guards;
- the same-origin adapter that exposes Elysia under `/api/*`.

### Elysia owns

- Better Auth and every `/api/*` endpoint;
- authentication and resource authorization;
- request and response validation;
- business and persistence services;
- database access and transactions;
- API errors, request limits, health, and optional development Swagger.

### PostgreSQL owns

- durable application and authentication data;
- constraints and transactional consistency.

## Request flows

### Public page

1. TanStack Start receives the request.
2. The route renders meaningful HTML and route-specific metadata.
3. The browser hydrates and continues with client navigation.
4. Public routes do not wait for a session unless they explicitly request one.

### Protected page

1. The server route guard forwards request headers to Better Auth.
2. An unauthenticated request redirects to sign-in before protected UI renders.
3. Authenticated browser queries call same-origin `/api/*`.
4. The posts page stays client-rendered after the server guard.

### API request

1. The TanStack Start API route passes the Fetch `Request` to Elysia.
2. Elysia validates input and resolves the session.
3. The feature service applies authorization and database behavior.
4. Eden Treaty gives the web client the Elysia contract type.

## Same-origin contract

Production pages, authentication, callbacks, and browser API requests use one origin:

```text
https://app.example.com/
https://app.example.com/api/auth/*
https://app.example.com/api/*
```

This keeps cookies first-party and removes public cross-origin configuration from the browser client. `BETTER_AUTH_URL` and `APP_URL` should both be `https://app.example.com`.

`VITE_SITE_URL` is a build-time value used for canonical and social URLs. Backend variables are runtime values needed by the TanStack Start process because it embeds Elysia.

## Deployment shapes

### Integrated web service

The recommended shape runs the TanStack Start output, its Elysia handler, and one database connection configuration in the web service. The web image contains the built Nitro server. A separate one-shot image applies migrations before the release.

### Split internal services

The repository also builds a standalone Elysia image. A platform may route public `/api/*` traffic to it while routing other requests to TanStack Start, provided:

- the browser still sees one origin;
- only one public API path is authoritative;
- auth headers and cookies are forwarded unchanged;
- both services use compatible releases and configuration;
- migrations run once outside application replicas.

The integrated route remains the default code path. A split deployment needs explicit platform routing and verification.

## Type flow

```text
Drizzle schema
   └── drizzle-typebox models
          └── Elysia runtime contract
                 └── Eden Treaty client
                        └── TanStack Query hooks and React
```

Type sharing catches integration mistakes during development. Elysia validation protects the runtime boundary. Authorization remains explicit service behavior.

## Non-goals

- Elysium does not prescribe a cloud provider.
- It does not provide tenant isolation or a general role system.
- It does not guarantee zero-downtime schema changes.
- It does not move business logic into TanStack Start server functions.
- It does not treat generated types as a replacement for validation, authorization, or tests.

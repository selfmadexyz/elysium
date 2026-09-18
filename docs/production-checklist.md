# Production checklist

Elysium supplies integration examples, not a production guarantee. Treat this checklist as a release gate and adapt it to the product's threat model and availability requirements.

## Product and branding

- [ ] Replace the Elysium sample name, copy, icons, manifest, and social images where appropriate.
- [ ] Replace the posts example with the real domain or label it clearly as a demo.
- [ ] Define the supported browsers, devices, locales, and accessibility target.
- [ ] Add terms, privacy information, and support contacts required by the product.

## Configuration and secrets

- [ ] Confirm the pinned Bun version matches local development, CI, and container builds.
- [ ] Use a unique, high-entropy `BETTER_AUTH_SECRET` per environment.
- [ ] Store database and OAuth credentials in a managed secret store.
- [ ] Confirm no secret is exposed through `VITE_*` variables or the browser bundle.
- [ ] Set `APP_URL` and `BETTER_AUTH_URL` to exact HTTPS production origins.
- [ ] Validate configuration at build and startup with actionable errors.

## Authentication and authorization

- [ ] Register exact OAuth callback URLs for every environment.
- [ ] Verify secure, HTTP-only, same-site cookie behavior in the deployed topology.
- [ ] Add authorization rules for every read and mutation; authentication alone is insufficient.
- [ ] Define password, email verification, account recovery, session lifetime, and revocation policies.
- [ ] Add abuse controls and rate limits to auth and mutation endpoints.
- [ ] Test login CSRF, redirect handling, session fixation, and cross-tenant access.

## API and application security

- [ ] Restrict CORS to known origins or remove cross-origin browser access.
- [ ] Review the included security headers and add a Content Security Policy appropriate for the application.
- [ ] Restrict or disable Swagger in production.
- [ ] Review request-size limits, file handling, error disclosure, and log redaction.
- [ ] Run dependency, secret, and container image scans in CI.
- [ ] Publish a vulnerability reporting process.

## Database and migrations

- [ ] Use TLS and least-privilege database roles.
- [ ] Apply committed migrations from one controlled release job.
- [ ] Review migrations for locks, data loss, and backward compatibility.
- [ ] Configure automated backups and point-in-time recovery.
- [ ] Test restoration and record the recovery time and recovery point objectives.

## Testing and quality

- [ ] Complete auth lifecycle coverage and add product-specific authorization tests.
- [ ] Extend authorization, validation, service, and migration coverage for the product domain.
- [ ] Cover critical UI and end-to-end product flows.
- [ ] Test production builds rather than only development servers.
- [ ] Run type checks, lint, tests, and builds on every pull request.
- [ ] Verify keyboard navigation, focus, screen-reader names, contrast, and reduced motion.

## SEO and public pages

- [ ] Verify that every public product route renders meaningful HTML.
- [ ] Review title, description, canonical URL, Open Graph, and Twitter metadata for every public route.
- [ ] Replace the placeholder social image and review robots, sitemap, icons, and web manifest.
- [ ] Keep public pages independent from private session requests unless the route requires one.
- [ ] Test the actual HTML response and social-card previews.

## Reliability and operations

- [ ] Add structured logs, request IDs, metrics, traces, and actionable alerts.
- [ ] Monitor availability, latency, error rates, database connections, and saturation.
- [ ] Define timeouts, retry policy, shutdown behavior, and resource limits.
- [ ] Make health checks distinguish process health from dependency readiness where needed.
- [ ] Document deployment, rollback, incident response, and ownership.
- [ ] Run smoke tests after every deployment.

## Release evidence

- [ ] Record the commit, migration, configuration version, and artifact digest.
- [ ] Preserve test and scan results for the release.
- [ ] Confirm the rollback or roll-forward path before sending traffic.
- [ ] Remove the phrase “production-ready” from public copy until the project's own release gates pass.

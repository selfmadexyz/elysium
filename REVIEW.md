# Review instructions

Read [AGENTS.md](AGENTS.md) and the applicable files in `.github/instructions/` before reviewing. Findings need an observable failure, a concrete scenario and `file:line` evidence; check the implementation rather than inferring behavior from a name.

## Important

Important findings break user-visible behavior, expose private data/secrets, bypass authorization, contaminate one request with another request's session/cache, lose data or prevent a safe rollback. Missing negative authorization tests or regression coverage that would allow such a failure are Important too.

Naming, helper preferences and stylistic alternatives are Nits. Report at most five Nits. Report a comment-rule violation once per class with all locations, outside that cap. Do not repeat lint/type errors already reported by CI; do report a broken or bypassed check.

## Risk tiers

Risk follows changed paths and behavior, not diff size. Any high-risk path makes the PR high risk.

High (deep review; a human reads the diff before merging):
- Auth/session/access: `packages/backend/src/modules/auth/**`, `packages/web/src/lib/auth.ts`, `packages/web/src/lib/auth-server.ts`, `packages/web/src/routes/_authenticated.tsx`, sign-in/sign-up route guards, and any newly added permission boundary.
- Server request isolation and API/CORS: `packages/web/src/routes/api.$.ts`, `packages/web/src/router.tsx`, `packages/backend/src/index.ts`.
- Data/schema/migrations: `packages/backend/src/database/**`, `packages/backend/src/lib/db.ts`, `packages/backend/drizzle/**`, `packages/backend/drizzle.config.*`, destructive writes and changes to ownership filters.
- Environment, caching and secrets: `packages/backend/src/env.ts`, env examples, `packages/web/vite.config.ts`, `packages/web/server/**`, `packages/web/vercel.json`, and changes to cache/cookie policy anywhere.
- CI, hooks, supply chain and deployment: `.github/workflows/**`, `.githooks/**`, `scripts/**`, Dockerfiles, dependency declarations/resolutions and runtime version pins.

Low: remaining changes that do not introduce one of the behaviors above.

## Convergent reviews

- Report a bug class once, including every location in the PR.
- Label pre-existing findings as such and place unrelated work in `BACKLOG.md`.
- On re-review, inspect lines changed since the previous review; older lines may be raised only for a new Important finding.
- Do not repeat findings already fixed or answered. Re-check a response against the code before escalating.
- Ignore generated migration metadata and routine lockfile churn, but inspect new dependencies, non-registry sources and integrity changes without a version change.
- Before declaring ready, distinguish checks actually run from checks still pending. A review approval does not override a failing required check or the human review expectation on high-risk paths.

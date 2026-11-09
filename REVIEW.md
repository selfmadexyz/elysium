# Review instructions

The repo rules below are the review checklist: a change that breaks one is a finding.

@AGENTS.md
@.github/instructions/react.instructions.md
@.github/instructions/backend.instructions.md

## What Important means here

Important: a finding that breaks behavior, loses or misreports data or money, leaks one user's or tenant's data to another, or blocks a rollback. In this repo, for example:
- a posts query, update or delete without the session-derived `authorId` predicate, or a create that takes `authorId` from the request;
- a private route without the `auth: true` macro, or one that answers 403 / a distinct body for another user's post instead of 404;
- a `QueryClient`, router or session shared across SSR requests, or a session-dependent response served without `Cache-Control: no-store`;
- a renewed session `set-cookie` dropped by the auth middleware or `getSession`, logging users out;
- a migration that breaks the running web image, rewrites an applied migration, or a backend secret reaching a browser bundle, `VITE_*` variable or log.

A test gap that lets one of those through is Important too: a scope or permission rule with no negative case, a filter test that doesn't assert what the boundary received, an expected value taken from the code under test, a fix shipped without a test that fails without it. A missing Required test keeps its default severity; naming, break-check and role/label rules are Nit.

Everything about naming, helpers or style is Nit at most. A comment that breaks "Comments — hard rule" in AGENTS.md is not a Nit: it keeps its default severity, outside the Nit cap. Report the class once with every location (`file:line` each) in the first review so it is fixed in one commit.

## Risk tiers

The tier comes from the files a PR touches, never from its size or author. One high path makes the PR high.

High: review deeply, and a human reads the diff before merging.
- Auth and access: `packages/backend/src/modules/auth/**`, `packages/backend/src/modules/posts/service.ts`, `packages/backend/src/modules/posts/index.ts`, `packages/web/src/lib/auth.ts`, `packages/web/src/lib/auth-server.ts`, `packages/web/src/routes/_authenticated*.tsx`, `packages/web/src/routes/sign-in.tsx`, `packages/web/src/routes/sign-up.tsx`.
- Request isolation, API surface and CORS: `packages/web/src/routes/api.$.ts`, `packages/web/src/router.tsx`, `packages/backend/src/app.ts`, `packages/backend/src/index.ts`, `packages/backend/src/routes/**`.
- What a deployed client reads: `packages/contracts/**`, `packages/backend/src/modules/*/model.ts`, `packages/backend/src/lib/models.ts`, `packages/backend/src/lib/errors.ts`.
- Migrations and data: `packages/backend/src/database/**`, `packages/backend/src/lib/db.ts`, `packages/backend/drizzle/**`, `packages/backend/drizzle.config.ts`.
- Runtime env, caching and secrets: `packages/backend/src/env.ts`, `packages/backend/.env.example`, `packages/web/vite.config.ts`, `compose.yaml`.
- CI, hooks, supply chain and deploy: `.github/workflows/**`, `.github/dependabot.yml`, `.githooks/**`, `scripts/**`, `.claude/settings.json` (which plugins agents load here), the "Tooling and CI" section of `AGENTS.md` (the commands agents run), `packages/web/Dockerfile`, `.dockerignore`, `.bun-version`, every `package.json` and `bun.lock` resolution change.

Low: everything else.

## Re-reviews

A review must converge, not find one more old bug per push.
- Report a bug class once, with every location, so it is fixed in one commit.
- Mark a finding on code this PR did not change as Pre-existing.
- On a re-review, report only on lines changed since the last review, unless the finding is Important.
- Do not repeat a finding the author already fixed or answered in a thread.

## Evidence

A claim about behavior cites file:line, not an inference from a name.

## Cap the nits

Report at most five Nits per review. Comment-rule violations don't count toward the five.

## Do not report

- What CI already enforces: lint and format, type errors, high and critical audit advisories in production dependencies
- Generated files: `packages/web/src/routeTree.gen.ts`, `packages/backend/drizzle/meta/**`
- Lockfile churn. Still report a new package, a resolution source that is not the registry (git, tarball, URL), or an integrity change without a version change.

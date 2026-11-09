# Elysium — agent instructions

Full-stack Bun starter: a React 19 / TanStack Start app rendered by Nitro, with an Elysia `/api` served from the same process, Better Auth sessions (email + Google) and PostgreSQL through Drizzle. It ships one feature, private per-user posts, and publishes two Docker images (web runtime and one-shot migrate). Read by Claude Code (through `CLAUDE.md`), Copilot code review and other agents. Personal setup (local paths, worktrees, preferences) goes in a gitignored `CLAUDE.local.md`.

## Comments — hard rule

**Zero comments by default.** Every comment you add is a defect unless it says what the code can't: units/encoding, an invariant the type doesn't enforce, a protocol/external quirk, a magic value. One-line doc comment on exported package boundaries only when the type hides a unit or invariant.

Never write a comment that:
- narrates the change, the discussion or a review round ("now uses X", "moved from Y", "fixed per review"): that goes in the commit;
- restates the next line, labels a section or explains a name: rename instead;
- sits in a test to repeat what the title or the assertion already says;
- starts with `ponytail:` (dropped before commit).

`// spec:`, `// seed:` and tool directives (`biome-ignore`, `@ts-expect-error`) are allowed when justified.

Before every commit, and before every push that answers a review: list the comments you added and delete each one that fails the rule. `bun run lint:comments` lists them (also run by the pre-push hook and as PR annotations in CI) and fails on `ponytail:`.

## Packages / layout

| Package | Alias | Dev port | What |
| --- | --- | --- | --- |
| `packages/web` | `@frontend/*` | 3000 (`vite dev`) | TanStack Start file routes, React pages, Query hooks, Nitro SSR; `/api/*` is dispatched to Elysia by `src/routes/api.$.ts` |
| `packages/backend` | `@backend/*` | 3001 (`dev:backend`, standalone) | Elysia app, Better Auth, Drizzle schema/migrations, feature services |
| `packages/contracts` | `@elysium/contracts/*` | — | Browser-safe TypeBox request/response schemas |
| `e2e/` | — | 3100 (built Nitro server) | Playwright smoke and authenticated flows |
| `scripts/`, `.githooks/` | — | — | Comment check, pre-push hook, image smoke |

Stack: Bun 1.4.4 workspaces, TypeScript, React 19, TanStack Start/Router/Query/Form, Vite + Nitro, Tailwind + Base UI (`src/components/ui/`), Elysia + TypeBox + Eden, Better Auth, Drizzle + PostgreSQL 17, Biome, Bun test (backend), Vitest (web), Playwright (e2e).

## Data

PostgreSQL → Drizzle service (`modules/<feature>/service.ts`) → Elysia route + TypeBox (`modules/<feature>/index.ts`) → Eden `treaty<App>` (`web/src/lib/client.ts`) → TanStack Query hook (`web/src/hooks/use-*.ts`) → React.

- PostgreSQL is the source of truth; the browser holds only the Query cache. A mutation invalidates the owning query key prefix (`['posts']`) on success, never patches local copies.
- Every API response is `Cache-Control: no-store` (`backend/src/app.ts`); only static assets get public cache headers (`web/vite.config.ts` `routeRules`). A session-dependent response never gets a public or shared cache entry.
- `getRouter()` (`web/src/router.tsx`) builds a new router and `QueryClient` per invocation; never hoist either to module scope or share a session or query cache across requests.
- Services throw `ServerError` subclasses (`backend/src/lib/errors.ts`); the global `onError` in `app.ts` maps them to `{ error, message }` and hides 5xx messages and validation details in production. Never return an ad hoc error body from a route.
- Hooks turn an Eden error into `throw new Error(response.error.value.message)` and treat missing `data` as an error; keep that shape so pages render their error state.
- Session reads go through Better Auth with `returnHeaders: true` and forward renewed `set-cookie` headers (`modules/auth/middleware.ts`, `web/src/lib/auth-server.ts`); a new session read keeps that forwarding.

### Type contracts

- API request/response shapes live in `packages/contracts/src/<feature>.ts` as TypeBox schemas plus `Static` types; the backend registers them as Elysia models in `model.ts`, the web imports the types from `@elysium/contracts/*`. Contracts import nothing from backend or web.
- Backend-only validation (query params, pagination) lives in the feature's `model.ts`; HTTP wiring in `index.ts`; queries and business rules in `service.ts`.
- Every route declares `response` per status, with errors as the shared `'error'` model (`backend/src/lib/models.ts`). The Eden client is typed by the exported `App` type: do not widen a route to `any` or bypass it with raw `fetch`.
- DB shapes live in `backend/src/database/schema.ts`. A schema change ships a generated migration (`bun run db:generate`) in `packages/backend/drizzle/`; never edit an applied migration or run `db:push` against a shared database. The PR says how the change behaves with old rows and whether a revert is safe.
- Env vars are declared in `backend/src/env.ts` (validated, `additionalProperties: false`) and `packages/backend/.env.example` together. Backend secrets never reach a browser import, a `VITE_*` variable or a log line.

## Product rules

- Public pages: `/`, `/get-started` (prerendered, allowlist in `web/vite.config.ts` `pages`), `/sign-in`, `/sign-up`, `/robots.txt`, `/sitemap.xml`. Private pages live under the `_authenticated` layout (`/posts`, client-rendered with `ssr: false`, `noindex`).
- The `_authenticated` redirect is UX only; authorization is the server's. Every private API route uses the `auth: true` macro and reads identity from the resolved `user`, never from a body, param or query.
- Posts are private to their author. Every list/get/update/delete query keeps the `authorId` predicate next to the ID; create assigns `authorId` from the session. Request contracts never accept an `authorId`.
- Another user's post answers 404, like a missing one; never 403 or any response that reveals it exists.
- List pagination: `limit` 1–100, default 20, `offset` ≥ 0 (`modules/posts/model.ts`, `service.ts`), newest first by `id`. The web asks for `POSTS_PAGE_SIZE + 1` rows to know whether a next page exists (`hooks/use-posts.ts`).
- Vocabulary: "post" (title ≤ 255 chars, body ≤ 20 000 chars, from `contracts/src/posts.ts`), "author" (the session user who owns it).
- TODO(owner): there are no roles, sharing or admin access; define them before adding any access path other than "author only".

## React

Path-scoped rules live in [.github/instructions/react.instructions.md](.github/instructions/react.instructions.md) (`packages/web/**`) and [.github/instructions/backend.instructions.md](.github/instructions/backend.instructions.md) (`packages/backend/**`, `packages/contracts/**`). Read the one matching the files you touch.

## Code style

- Full descriptive names (`event`, `index`, `response`), including callback params; `i`/`j`/`k` only in tight numeric loops.
- Helpers: inline by default, even if longer; no generic mini helpers (`sum(fn)`, `isDefined`), write the explicit loop with one named line per value. Never export "for later": export only what another file imports, delete code with no caller.
- More than two parameters, or two or more callbacks: one destructured object typed by a named `type XArgs`, called with named fields (`startRun({ key, amount, onSuccess })`). A positional signature is converted when touched.
- Duplicated code is fine, a duplicated rule is not. A constant, limit, value list, label map or parse/format pair lives in one place; extract on the third use or when two places must stay identical. Grep for the existing guard or formatter before writing one.

## Testing

- Required: backend services and routes (ownership, status codes, error mapping), the auth middleware and session forwarding, env parsing, web modules with logic (`src/lib/*`, hooks that derive data such as pagination), harness scripts (`scripts/*.test.ts`), and the e2e smoke suite. Not required: pure UI, trivial wrappers, nice-to-have features, copy.
- A test names the rule it guards and what breaking it causes ("X, so Y").
- Expected values come from the rule's source (spec, shared constant, a case computed by hand), never from running or reading the code under test. Literals only: no snapshot, no loop or formula that recomputes the result.
- Before keeping a test, break the line it guards and watch it fail; a test that stays green is deleted, not kept for coverage. Applies to tests added or touched.
- A test that would still pass if the code under test returned nothing (`undefined`, `[]`, `null`) or did nothing checks nothing: assert the value or the side effect. An expected empty result or error is tested next to a case where the result is not empty.
- A function over the linter's cognitive complexity warning is split or simplified when touched, not left for later.
- Mock only boundaries (DB, external APIs, auth, HTTP), and when the rule is a filter (user, org, role, tenant) assert what the boundary received (the compiled query params, the request's filter and variables).
- Every scope or permission rule has a negative case: another user, another org, a lower role.
- UI tests query by role or label and assert what the user sees.
- Backend DB tests run only with `RUN_DATABASE_TESTS=1` against a database named exactly `elysium_test` (`backend/test/setup.ts`); e2e uses `E2E_DATABASE_URL` (`elysium_test` or `elysium_e2e`). Never point a test at a real database or real OAuth credentials.

## Tooling and CI

The shipkit skills read their commands from this section; keep every line accurate.

- After cloning, `bun run hooks` once installs the pre-push hook (`.githooks/`: lint, typecheck, harness tests, comment check).
- Default branch: `main`.
- Install: `bun install --frozen-lockfile` (Bun version pinned in `.bun-version`).
- Lint: `bun run lint` (Biome). Typecheck: `bun run typecheck` (harness, contracts, backend, web). Added comments: `bun run lint:comments`.
- Build: `bun run build` (Vite build, then `tsc --noEmit` for the web package), needed when `packages/web/**`, `packages/backend/src/**`, `packages/contracts/**`, a `package.json` or `bun.lock` change. `packages/web/Dockerfile` is checked by the `images` CI job (`scripts/smoke-image.sh`), not by this build.
- Tests: `bun run test` (harness + every package); per package `bun run --cwd packages/backend test` (Bun; database tests need `RUN_DATABASE_TESTS=1` and `DATABASE_URL` set in the shell to a migrated database named exactly `elysium_test`, otherwise `packages/backend/.env` supplies it), `bun run --cwd packages/web test` (Vitest), `bun run test:harness` for `scripts/`.
- E2E: `e2e/` (Playwright, `chromium` project). Export `E2E_DATABASE_URL` (database `elysium_test` or `elysium_e2e`; `e2e/auth-posts.spec.ts` throws without it), run `DATABASE_URL="$E2E_DATABASE_URL" bun run --cwd packages/backend db:migrate`, `bun run build`, `bunx playwright install chromium`, then `bun run test:e2e`: `playwright.config.ts` starts the built Nitro server on port 3100 against that database. A signed-in user comes from `signIn()` in `e2e/auth-posts.spec.ts`: it signs up through the API, marks the email verified in the database, then signs in; the UI sign-up alone stops at email verification.
- Locales: none.
- CI (`.github/workflows/ci.yml`): `lint` (Biome, added comments on PRs, typecheck, harness tests), `audit` (`bun audit --prod --audit-level=high`), `test-backend` (fresh migrations + DB tests), `test-web` (Vitest + build), `test-e2e`; `images` runs only after all five. Never loosen a check or ignore an advisory to get green.
- Generated files: `packages/web/src/routeTree.gen.ts` and `packages/backend/drizzle/meta/**`; never edit them by hand.

## Workflow

- One concern per PR: small diff, short human-readable body; unrelated fixes go in their own PR. Conventional titles and commits (`feat(web): …`, `fix(api): …`, `chore(ci): …`), in English.
- Never push to a merged PR's branch: check `gh pr view` first, and move follow-ups to a new PR from the default branch.
- Branches: `feat/…`, `fix/…`, `chore/…`, named after the change.
- Every change starts from a ticket (a `BACKLOG.md` entry or a GitHub issue); with the shipkit plugin, through `/shipkit:start`: plan, design check when the change sets a pattern, one approval, code, then `/shipkit:ship`, `/shipkit:watch-pr` and `/shipkit:learn`.
- Deferred or unrelated findings go in `BACKLOG.md` (Now / Next / Later / Ideas), not in the PR.
- Skills (shipkit plugin, enabled in `.claude/settings.json`): `/shipkit:start`, `/shipkit:ship`, `/shipkit:watch-pr`, `/shipkit:learn`, `/shipkit:design-critic`. Without the plugin, follow Done means, [REVIEW.md](REVIEW.md) and the PR template by hand; neither CI nor the hooks depend on it.
- A mistake caught twice becomes a test, a lint rule or one bullet here or in `.github/instructions/` (`/shipkit:learn`), never a comment.
- Review checklist and risk tiers: [REVIEW.md](REVIEW.md). CI and external setup: [docs/ai-harness.md](docs/ai-harness.md).

## Done means

Run what the change touches, and report failures as they are. A check counts as passing only when its command ran after the last edit and you read its output; an earlier run or "should pass" is not evidence.
1. `bun run lint` and `bun run typecheck`. Read the typecheck output unfiltered: count errors, never `grep -v` it.
2. The tests of what changed, then the package's whole test suite. A fix ships with a test that fails without it.
3. Auth (sign-in/up, session cookies, the `_authenticated` redirect), posts CRUD and ownership, SSR/prerender or the `/api` dispatch touched: `bun run build` then `bun run test:e2e`.
4. UI touched: run the app and look at it (screenshot) at narrow and desktop widths.
5. Re-read the diff for leftovers: debug code, helpers with a single call site, and every added comment against "Comments — hard rule" (`bun run lint:comments`).

## Deployment

- Pushes to `main` publish `ghcr.io/<owner>/elysium-web` and `elysium-migrate` (`packages/web/Dockerfile` targets `runtime` and `migrate`) after every CI job and the image smoke test pass (`.github/workflows/docker.yml`). Publishing requires the `PUBLIC_APP_URL` repository variable.
- The `migrate` image runs `db:migrate`, and the web image ships the same migrations as `bun /app/migrate/migrate.mjs` for platforms with a pre-deploy command; a schema change must work for the currently running web image until the new one rolls out.
- No staging or production target is configured in this repo: do not add deploy hooks, credentials or release promotion.
- The starter is platform-agnostic: it ships a Bun server and Docker images, never one hosting provider's config files, SDKs or env names. Platform-specific setup belongs in the project created from this template.

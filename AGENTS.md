# Elysium — agent instructions

Full-stack starter: Bun workspaces, React 19, TanStack Router/Query/Form, Vite + Nitro SSR, Elysia, Better Auth, Drizzle and PostgreSQL. This file is shared by Codex, Claude (through `CLAUDE.md`) and GitHub reviewers. Personal paths and preferences belong in gitignored `CLAUDE.local.md`.

## Architecture

| Package | Alias | Responsibility |
| --- | --- | --- |
| `packages/backend` | `@backend/*` | Elysia `/api`, auth, TypeBox contracts, Drizzle schema and services |
| `packages/contracts` | `@elysium/contracts/*` | Browser-safe TypeBox API request/response schemas |
| `packages/web` | `@frontend/*` | React pages, TanStack Start file routes, Query hooks, Nitro SSR |

Data flows from PostgreSQL → Drizzle service → Elysia route + TypeBox → Eden client → TanStack Query → React. Backend feature modules use `index.ts` (HTTP), `service.ts` (queries/business logic) and `model.ts` (validation/types).

`packages/web/src/routes/api.$.ts` dispatches `/api` requests to Elysia. TanStack Start server functions in `src/lib/auth-server.ts` read the current request's session; route guards consume it. `src/router.tsx` constructs a router and QueryClient per invocation. Preserve request isolation: never share a user's session or server query cache across requests. Routes live in `src/routes/`; `src/routeTree.gen.ts` is generated and must not be edited by hand.

## Backend and auth

- Validate input at the HTTP boundary and keep the Eden contract typed. Keep DB queries in services and preserve status/error semantics in `src/lib/errors.ts` and the global error handler.
- Authentication belongs on the server; a client redirect is not authorization. When adding an ownership or permission boundary, derive identity from the session and test a denied case as well as an allowed case. Posts are private to their session-derived author. Preserve author predicates for list/get/update/delete and assignment on create; test another user cannot access or change them.
- Session-dependent responses must not become public or shared-cache entries. Preserve cookie, CORS and trusted-origin behavior deliberately.
- Secrets stay server-side. Update `packages/backend/.env.example` and `src/env.ts` together when changing env requirements. Do not put backend secrets in browser imports, Vite build arguments or logs.
- Schema changes require generated Drizzle migrations in `packages/backend/drizzle/`. Do not rewrite an applied migration or run `db:push` against a shared database. Explain data/backward compatibility and rollback limits.

## React

Read [.github/instructions/react.instructions.md](.github/instructions/react.instructions.md) for web changes and [.github/instructions/backend.instructions.md](.github/instructions/backend.instructions.md) for API changes. Keep installed component and form patterns; inspect existing Base UI components before adding another implementation or dependency. Do not assume React Compiler, i18n or external state stores are installed. Playwright smoke coverage lives in `e2e/` and runs against the built Nitro app.

## Comments

No comments by default. Keep a comment only when it states an otherwise invisible unit, invariant, external quirk or magic value. Do not narrate a change, restate the next line, label a code section or repeat a test title. `// spec:`, `// seed:` and justified tool directives such as `biome-ignore` are allowed. Remove every `ponytail:` review annotation before shipping.

Run `bun run lint:comments` and read each reported addition; the script flags comments for human judgment and rejects `ponytail:` annotations. A green check alone does not justify prose.

## Workflow

- Bun is the package manager/runtime; `.bun-version` pins the local and CI version. Install with `bun install --frozen-lockfile` for verification. Run `bun run hooks` once per clone to install the versioned pre-push hook.
- Keep changes scoped and preserve unrelated working-tree edits. One concern per PR. Conventional commit/PR titles in English (`fix(web): …`, `chore(ci): …`); branches use `codex/` unless the user requests otherwise.
- Before pushing, check the PR state. Never push to a merged/closed PR's branch; use a new branch from `main` for follow-ups.
- Repo skills: `$ship` / `/ship`, `$watch-pr` / `/watch-pr`, `$design-critic` / `/design-critic`. Canonical instructions live in `.agents/skills/`, with Claude discovery links in `.claude/skills/`. Honor the authorization already provided by the user; prepare the concrete result before asking for any missing permission.
- Review guidance and path-based risk tiers live in [REVIEW.md](REVIEW.md). A high-risk change needs a human diff review before merge. Record unrelated findings in [BACKLOG.md](BACKLOG.md), not in this PR's scope.

## Done means

1. Run `bun run lint`, `bun run typecheck` and `bun run lint:comments`. Read complete errors; do not hide failures by filtering logs.
2. Run affected tests first, then the affected package suite (`bun run --cwd packages/backend test` or `bun run --cwd packages/web test`). A behavior fix includes a regression test that demonstrably fails on the broken behavior. Do not manufacture tests for formatting or static documentation changes.
3. Run `bun run build` when runtime/build inputs change. CI also checks production dependency advisories; do not silently ignore advisories or loosen checks to obtain green results.
4. Visible UI changes: run the app and inspect the relevant states at narrow and desktop widths. Save a local screenshot or demo when tooling is available; report any missing browser verification. Never claim an unconfigured e2e suite ran.
   Run `bun run test:e2e` after `bun run build` and Chromium installation (`bunx playwright install chromium`). Smoke coverage checks public HTML/navigation and auth screens; authenticated E2E uses a disposable database. A real Google OAuth exchange still needs provider configuration.
5. Review the final diff for debug code, secrets, unrelated edits and added comments. Report actual command results and limitations, including pre-existing failures.

## CI and publishing

See [docs/ai-harness.md](docs/ai-harness.md) for the local → PR → CI workflow and external setup. All validation jobs must pass before image publication. Repository files do not activate external reviewer apps or branch protection. Elysium has no configured staging/production release target; do not copy another project's deploy credentials, hooks or release pipeline.

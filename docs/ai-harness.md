# AI harness and CI

Adapted from the local `railnet-app` process for Elysium's three-package Bun starter. The portable parts live in this repository; personal configuration and service accounts do not.

## Context and discovery

| File | Purpose |
| --- | --- |
| `AGENTS.md` | Architecture, data/auth boundaries, comments and completion criteria |
| `CLAUDE.md` | Loads `AGENTS.md` in Claude |
| `.github/copilot-instructions.md` | Points GitHub Copilot at repo/review guidance |
| `.github/instructions/*.instructions.md` | Path-scoped React/backend rules |
| `.claude/rules/` | Relative links to those same scoped rules |
| `REVIEW.md` | Important findings, high/low risk and convergent re-reviews |
| `.claude/settings.json` | Denies Claude reads of `.env` files, disables its co-author trailer, and registers and enables the shipkit plugin |
| `.plans/` (ignored) | Plan files `/shipkit:start` writes per branch |
| `CLAUDE.local.md` | Ignored personal preferences and local paths |
| `BACKLOG.md` | Confirmed findings outside the active change |

The workflow skills (`start`, `ship`, `watch-pr`, `learn`, `design-critic`) come from the shipkit Claude Code plugin (`selfmadexyz/shipkit`, a private marketplace), not from this repository; they read this repo's commands from `AGENTS.md` → "Tooling and CI". Claude Code offers the install to anyone who trusts the repo; without access to the private marketplace the offer fails and nothing else changes: the rules in `AGENTS.md`, `REVIEW.md` and the PR template still apply, and neither CI nor the hooks depend on the plugin. These files do not authenticate services or turn on automatic reviewers.

## Local workflow

1. Install the Bun version in `.bun-version`, then `bun install --frozen-lockfile` and `bun run hooks` once per clone.
2. `/shipkit:start` takes a ticket from `BACKLOG.md` or a GitHub issue, has a fresh agent describe the affected code without knowing the ticket, writes the plan, runs `design-critic` when the change sets a pattern, asks for one approval, then implements.
3. `/shipkit:ship` runs lint/typecheck/tests, reviews, the comment sweep and a local UI demo when a screen can change, then commits, pushes and opens the PR after one confirmation.
4. `/shipkit:watch-pr` follows the PR's checks and reviews for at most three push rounds, verifies bot findings and fixes bug classes; `/shipkit:learn` then turns what they caught into a test, a lint rule or one rule line, or nothing.
5. A human reviews high-risk diffs before merge. The PR template records Testing / Risk / How to revert.

The pre-push hook runs the repo's local checks. It must be installed for each clone and can be bypassed by Git; it does not replace CI or GitHub branch rules. `lint:comments` rejects review annotations and lists additions requiring judgment; it cannot decide whether a comment is useful.

## CI and image publication

The `CI` workflow runs `lint` (Biome, added comments, types and harness tests), `audit`, `test-backend` (fresh PostgreSQL migrations and real ownership integration tests with `RUN_DATABASE_TESTS=1`), `test-web` (Vitest and Nitro build), and `test-e2e` (Chromium smoke tests). The `images` job depends on all five. Its reusable workflow builds and smokes the web and one-shot migration images. Publication waits for every image smoke test, then uploads the exact saved/tested images only on pushes to `main`. Fork PRs do not log in to GHCR or need publishing credentials.

Locally, build with `bun run build`, install Chromium using `bunx playwright install chromium`, then run `bun run test:e2e`. The smoke suite checks API health, SSR landing/hydrated navigation and sign-in/sign-up screens. Authenticated CRUD and session-cookie tests use a disposable database; a real Google OAuth exchange requires provider configuration. Use the disposable test database configuration described by `playwright.config.ts`.

Use the workflow files as the authoritative job/command list. Tests and builds run against isolated CI env values, not a developer's `.env`. Failing pre-existing checks remain failures and must be reported rather than silently excluded.

## GitHub setup outside the checkout

For enforcement on `main`, configure a branch ruleset that requires PRs, the five validation jobs (`lint`, `audit`, `test-backend`, `test-web`, `test-e2e`), successful image builds, resolved conversations and human approvals as appropriate. Run the workflow first so GitHub can discover the exact check names, including the reusable workflow's nested image job names; there is no separate aggregate gate job. Add CODEOWNERS or required specialist review only after maintainers/teams are known. Local instruction files do not prove any of these settings exist.

If desired, enable GitHub Copilot code review and install/configure a Claude reviewer integration with appropriate repository permissions and credentials. No Claude action is enabled here by assumption, and no API key is committed. Check each integration's instruction support; `REVIEW.md` is the common checklist to include in its configuration.

Dependabot updates Bun dependencies and GitHub Actions on the configured schedule. Dependency upgrades still need review and passing checks; auto-merge is not enabled by these files. Security fixes keep Bun/runtime pins aligned, update patched TanStack Start and Better Auth releases, and pin vulnerable transitive packages without an advisory ignore list. Development API docs use the maintained Elysia OpenAPI plugin at the existing `/api/swagger` and `/api/swagger/json` paths.

## Deliberately unconfigured services

There is no configured staging/production deployment target or digest-promotion release system in Elysium. Docker image publication is not evidence that an app has deployed. Define the hosting provider, environments, secrets, migration order, health checks and rollback strategy before adding release/deploy automation.

The original project's onchain fork tests, widget/admin packages, localization pipeline, telemetry deployments, Render hooks, Slack/Linear notifications and personal worktree CLI are project-specific and are not prerequisites for this starter. The Elysium smoke suite does not replace those project-specific tests. No MCP server is installed by this harness; `/shipkit:ship` records UI demos with the repo's own Playwright setup, in a gitignored `e2e/*.local.spec.ts`.

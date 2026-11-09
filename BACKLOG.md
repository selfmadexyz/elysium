# Backlog

One entry per ticket: `- **<title>** — <context: why, where, evidence>. Next: <first concrete action>.` `/shipkit:start` takes entries from "Now" and marks the one in progress. `/shipkit:ship` deletes it in the PR's commit when this file is committed (it disappears at merge), or marks it with the PR number when it is gitignored (`/shipkit:start` prunes it once the PR is merged).

## Now

## Next

## Later

- **Turn on GitHub reviewers and required checks** — instruction files alone do not activate Copilot code review, Claude Code Review or branch protection on `main` (see `docs/ai-harness.md`). Next: configure the reviewer integrations and a ruleset requiring the CI jobs.
- **Define hosting and rollback** — there is no staging or production target, so deploy hooks and release promotion have nothing to point at. Next: choose the hosting platform and write its migration order and rollback steps.
- **Prune stale rate-limit rows** — Better Auth updates `rate_limit` counters but never deletes rows, so the table only grows. Next: once a hosting platform is chosen, schedule a job deleting rows whose `last_request` is older than a day.
- **Pin the shipkit plugin version** — `.claude/settings.json` enables `selfmadexyz/shipkit` unpinned, so a shipkit release changes how agents commit and push here with no diff in this repo. Next: pin the marketplace source to a tag once shipkit publishes tagged releases.

## Ideas

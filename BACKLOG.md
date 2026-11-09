# Backlog

Record confirmed work outside the current change with context and a concrete next action. Do not turn speculative review suggestions into obligations.

## Now

- **Move the agent harness to the shipkit plugin** — the repo keeps its own copies of the ship / watch-pr / design-critic skills in `.agents/skills/` (linked from `.claude/skills/`), which now drift from the shipkit plugin that holds the maintained versions plus start and learn. Next: run `/shipkit:init` in update mode and remove the local copies. [in progress: claude/zealous-volta-njcujn]

## Next

## Later

- Configure the chosen GitHub reviewer integrations and required status checks on `main`; instruction files alone do not activate them. See `docs/ai-harness.md`.
- Define staging/production hosting and rollback requirements before adding deploy hooks or release promotion workflows.

- Prune stale `rate_limit` rows (for example rows whose `last_request` is older than a day) with a scheduled job once a hosting platform is chosen; Better Auth updates counters but never deletes them.

## Ideas

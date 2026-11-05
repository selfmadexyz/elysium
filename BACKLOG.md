# Backlog

Record confirmed work outside the current change with context and a concrete next action. Do not turn speculative review suggestions into obligations.

## Later

- Configure the chosen GitHub reviewer integrations and required status checks on `main`; instruction files alone do not activate them. See `docs/ai-harness.md`.
- Define staging/production hosting and rollback requirements before adding deploy hooks or release promotion workflows.

- Prune stale `rate_limit` rows (for example rows whose `last_request` is older than a day) with a scheduled job once a hosting platform is chosen; Better Auth updates counters but never deletes them.

## Ideas

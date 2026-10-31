# Backlog

Record confirmed work outside the current change with context and a concrete next action. Do not turn speculative review suggestions into obligations.

## Later

- Resolve pre-existing production dependency advisories: `bun run audit` reported 67 advisories (6 critical, 61 high) in the harness-only snapshot retaining TanStack Start. Upgrade affected direct/transitive dependencies to patched versions and rerun checks; no ignore list was added, so audit intentionally blocks image publication until resolved.
- Configure the chosen GitHub reviewer integrations and required status checks on `main`; instruction files alone do not activate them. See `docs/ai-harness.md`.
- Define staging/production hosting and rollback requirements before adding deploy hooks or release promotion workflows.

## Ideas

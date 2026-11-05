---
name: design-critic
description: Independently challenge a new Elysium architecture or operational pattern and compare alternatives as keep, change or BACKLOG. Use for /design-critic, challenge the design, or new modules, dependencies, auth/data layers, schema and CI patterns.
---

# Design critic

Use for decisions that establish a pattern: a new module/package, dependency, data/cache layer, auth boundary, DB migration or CI/deployment design. Small changes within an existing pattern generally do not need this pass.

Write a neutral brief containing the user problem and completion criteria, applicable `AGENTS.md` constraints, relevant existing files and known operating limits. Do not leak the chosen approach, diff, reasoning or preferred alternative.

Spawn a fresh read-only agent without conversation history, using only the brief and this request:

> Read AGENTS.md and the listed existing files. Design the solution you would ship here. In under 40 lines, give modules and data flow, reuse of existing code, dependencies needed and why installed tools are insufficient, the two main risks, and what you leave out. Do not edit files.

Use a no-history agent mechanism available in the host. If none is available, report that a genuinely independent design review could not run; do not label a self-review as independent.

Compare designs on correctness/failure modes, fit with existing Elysium code, change scope, dependencies, operational cost and reversibility. Return one or more concrete verdicts:

- **keep**: the current approach is equal or better on relevant axes; explain why.
- **change**: an alternative improves a named axis without a correctness/security loss; identify the precise revision.
- **BACKLOG**: an evidenced improvement outside current scope; record context and next action in this repo's `BACKLOG.md`.

An alternative is not better merely because it is different. Summarize the brief's problem, the independent proposal and the verdict. Incorporate ordinary in-scope improvements within existing task authorization; surface product/scope choices or irreversible actions for the user before acting. Do not expand the assignment to implement backlog ideas.

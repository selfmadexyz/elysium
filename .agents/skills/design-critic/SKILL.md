---
name: design-critic
description: Independent design check for a change that sets a pattern (new module or package, new dependency, DB schema or migration, infra/CI/deploy, new client-state or data layer). A fresh agent gets only the problem and the constraints, never our approach, designs its own, and the comparison ends in keep / change / BACKLOG. Use at plan time, when the user says "/design-critic", "design critic", "challenge the design", or when /ship calls it on a high tier.
---

# Design critic

A second design written blind, compared with ours. Its value is independence: the critic never sees our plan, our diff or our reasoning, or it just confirms them.

## 1. Does it apply

Run only when the change sets a pattern others will copy:
- a new module, package or app surface
- a new dependency (any manifest addition)
- a DB schema change or migration
- infra: deploy config, Dockerfile, CI workflows, env vars, caching, auth
- a new layer: store, cache, queue, data source

Otherwise stop and say "no design critic: <why>". A bug fix, copy change or change inside an existing pattern never qualifies.

## 2. Brief

Write the brief before looking at alternatives yourself. It holds:
- **Problem**: what the user or caller needs, in product terms, and what done looks like.
- **Constraints**: the AGENTS.md rules that apply (by section), the packages and existing modules it must fit, scale and deadline if known.
- **Files to read**: existing code the solution has to plug into (paths only).

It never holds: our chosen approach, library names we picked, the plan, the diff, or "we were thinking of…". Re-read the brief and strip any sentence that leaks the answer.

## 3. Critic

Spawn a fresh `general-purpose` agent (never `fork`: a fork inherits our reasoning) with the brief and this ask:

> Read AGENTS.md and the files listed. Design the solution you would ship here. Return, in under 40 lines: the approach (modules, data flow, where each piece lives), what you reuse from the codebase, any new dependency and why the platform or installed deps don't cover it, the two main risks, and what you deliberately left out. Read-only: no edits.

## 4. Compare

Put the two designs side by side on fixed axes: correctness and failure modes, fit with AGENTS.md and existing code, files and lines touched, new dependencies, operational cost, reversibility.

Verdict, one of:
- **keep**: ours is equal or better on every axis that matters. One line on why.
- **change**: the critic's design is strictly better on a named axis, with no loss on correctness or security. Name the axis, the concrete difference, and what changes in our plan.
- **BACKLOG**: a better idea that is out of scope for this change. Add it to `BACKLOG.md` at the repo root (Later or Ideas) with one line of context.

"Different" is not a verdict: an alternative with no named win is **keep**. Several verdicts are fine when the critic raises separate points.

## 5. Report

Show the user, short: the brief's problem line, the critic's approach in three lines, the verdict(s) with their axis. A **change** is never applied silently: at plan time it updates the plan the user approves; from /ship it goes in the confirmation as a decision for the user.

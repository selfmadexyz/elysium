---
name: ship
description: Prepare the current Elysium change for commit, push and a pull request, with scoped checks and an independent review. Use for /ship, ship it, or a request to commit, push and open a PR.
---

# Ship

Read `AGENTS.md`, `REVIEW.md` and `.github/pull_request_template.md` in this repository. Keep the user's existing authorization and working-tree changes intact.

## Prepare

- Inspect status, staged/unstaged changes and the branch diff from the merge base with `origin/main`. Separate task files from unrelated edits; never stage everything blindly.
- Check the branch's PR state with `gh pr view --json state,url`. A missing PR is normal; an auth/network error is not proof no PR exists. Never push to a merged/closed PR's branch. Create a `codex/` branch from the appropriate base when needed, preserving user work.
- Classify risk using `REVIEW.md`; one high path makes the change high risk.

## Validate and review

- Run `bun run lint`, `bun run typecheck` and `bun run lint:comments`; read complete diagnostics. Run changed tests first, then each affected package's suite: backend uses Bun, web uses Vitest through `bun run --cwd packages/web test`.
- For a behavioral fix, prove the regression test detects the original bug (on an isolated copy or with a reversible mutation confined to your own edits). Restore it and rerun. Do not mutate unrelated user changes to prove a test.
- Run `bun run build` for runtime/build changes. Do not invent an e2e command: inspect the repo's actual tooling. Pending CI is pending, never passed.
- Obtain an independent code review in a fresh agent context. High risk also needs a focused security pass on the changed boundaries; use `design-critic` when the change establishes a new pattern. Optional external review plugins may supplement this if installed; their absence must not be presented as a successful review. If independent agents are unavailable, disclose that verification gap.
- Fix supported findings and rerun relevant checks. Inspect all comments listed by `lint:comments`, remove narration and `ponytail:` annotations, then reread the final diff.
- For visible UI changes, inspect relevant states at narrow and desktop widths. Save a local screenshot/demo if tooling supports it. Keep demo recordings local; do not upload them without explicit instruction. Report unavailable browser verification honestly.

## Publish within authorization

Prepare a concise recap: files/scope, risk paths, actual check results, review findings and disposition, demo path or gap, commit title, and PR body with Testing / Risk / How to revert. Explain migration or compatibility limits on rollback. A high-risk PR still requires human diff review before merge.

If commit/push/PR authorization is missing, ask once for the concrete prepared actions. Explicit authorization already given in the conversation remains valid; do not demand a second ritual confirmation. Do not include unrelated remote actions, review replies, release or merge in the request.

Stage only approved task paths, commit with a conventional English title, push the task branch (letting the pre-push hook run), then create or update its open PR. Use a body file for multiline `gh pr create` text. Do not claim success on a rejected push or hook failure; fix and rerun or report the actual blocker. Return the PR URL and suggest `watch-pr` for CI/review follow-up. Do not merge or deploy as part of this skill.

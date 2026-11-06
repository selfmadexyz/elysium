---
name: watch-pr
description: Watch an open PR's CI and review comments, fix what fails or what reviewers ask in at most 3 rounds, and push the fixes after one confirmation per round. Use when the user says "/watch-pr", "autofix the PR", "watch the PR", "fix the CI", or after /ship opened a PR.
---

# Watch PR

Argument: a PR number. None: the PR of the current branch (`gh pr view --json number,url,state,headRefName`).

The loop must converge: an agent author and an agent reviewer can cycle forever, each round finding one more old bug. Bounded rounds, new diff only, whole bug classes.

## 0. Guard

- `state` not `OPEN`: stop. Never push to a merged or closed PR; propose a new branch from `main` with the fix.
- Work on the PR's head branch, up to date (`git pull --ff-only`). Dirty tree with files unrelated to the PR: stop and say so.
- Risk tier: match `gh pr diff <n> --name-only` against REVIEW.md → "Risk tiers". Any high path → high.
- Round counter starts at 0. A round = one push of fixes.

## 1. Wait for CI

- Right after a push, GitHub still reports the previous head for a few seconds and the new head's runs don't exist yet, so `gh pr checks --watch` alone returns the old head's results. Pin the SHA and wait for its runs first, in one background command (`run_in_background: true`); its exit re-invokes you:
  ```bash
  sha=$(git rev-parse HEAD)
  until [ "$(gh pr view <n> --json headRefOid -q .headRefOid)" = "$sha" ] && [ -n "$(gh run list --commit "$sha" --json databaseId -q '.[0].databaseId')" ]; do sleep 10; done
  gh pr checks <n> --watch
  ```
  No `--fail-fast`: one known failure must not hide the other checks. Read results only from runs of `$sha`.
- Meanwhile, read the review side (step 3).

## 2. CI failures

- Failed runs: `gh run view <run-id> --log-failed`. Read the real error, not the summary line.
- Reproduce locally with the narrowest command (one test file, `bun run typecheck`, `bun run lint`), then fix the root cause. CI jobs: `lint` (Biome, `lint:comments`, typecheck, harness tests), `audit`, `test-backend` (needs `RUN_DATABASE_TESTS=1` and an `elysium_test` database), `test-web`, `test-e2e` (`bun run build` then `bun run test:e2e`), `images`.
- Flaky (passes locally, unrelated to the diff, e.g. network timeout): no code change, propose `gh run rerun <run-id> --failed`.

## 3. Review comments

- Unresolved threads: `gh api graphql` on `pullRequest.reviewThreads` (`isResolved`, `path`, `line`, `comments.body`, `author.login`). Plus `gh pr view <n> --json reviews,comments` for top-level reviews.
- Each comment: fix it, or skip it with a one-line reason (wrong, contradicts AGENTS.md, pre-existing, out of scope). Bots (Claude, Copilot) are checked against the code before fixing; never fix a finding that isn't real.
- A test added or touched while fixing: break the line it guards, run it, see it fail, restore; a test that stays green is deleted.
- Comment rule (AGENTS.md → "Comments — hard rule"): a reviewer comment about a comment is always fixed, never skipped as a nit, in any round and even on lines the last push didn't change. Don't wait to be told: every round, run `bun run lint:comments` on the PR's branch (working tree included) and delete each hit that fails the rule, including comments your own fixes added. Never answer a review with a comment narrating the fix.
- Fix the class, not the line: grep the PR diff for the same pattern and fix every occurrence in one commit.
- Attack the premise: when two fixes resting on the same assumption fail the same check (CI job or reviewer point), do not try a third. Write that assumption in one sentence, find what makes it false, and fix that; if it is a design choice of the PR, stop and put it to the user.
- Pre-existing: the flagged code predates the branch (`git blame` against `git merge-base origin/main HEAD`). Not this PR: skip, add to BACKLOG.md.
- Already answered: a finding fixed or skipped in an earlier round that a bot reports again is listed as "déjà traité", never handled twice.
- Round ≥ 1: only handle findings on lines the last push changed (`git diff <previous-head>..HEAD`) and new CI failures. A new finding on code the PR already had in round 0 is listed, not fixed, unless it is Important (REVIEW.md).
- Out-of-scope fix asked by a reviewer: separate PR, not this one.

## 4. Confirmation

Show, short:
- round `n/3`, risk tier
- CI: failing checks → cause → fix (or rerun)
- comments: fixed / skipped (why) / déjà traité / pre-existing → BACKLOG
- commits to create, one per fix, titled by the effect (`fix(web): <effect>`), never "address review". Fixes stay uncommitted in the working tree until the yes; step 5 creates the commits.
- comment sweep: hits found / deleted, or "clean"
- lint + typecheck result, tests of the changed files

Ask once: "Push ? (commits + push)". Anything but a clear yes: stop. Replying to or resolving review threads on GitHub is part of that question only if listed in it.

## 5. Push and loop

- Stage the fix files by path, commit (no `Co-Authored-By`), `gh pr view` state check again, `git push`. Round counter + 1.
- Round 3 pushed and CI still fails or new Important findings land: stop. Report what each round fixed and what keeps coming back, and say the approach needs re-evaluating (split the PR, change the design) rather than a 4th patch.
- Otherwise back to step 1 on the new head.
- Done when every check is green and no unresolved thread is left unanswered: print the PR URL and stop.

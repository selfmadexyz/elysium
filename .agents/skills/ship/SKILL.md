---
name: ship
description: Take the current change from working tree to an open PR with one confirmation. Classifies the risk tier, runs lint + typecheck + the tests of what changed (e2e left to CI), a local /code-review --fix pass, records a demo (video or screenshot of the new UI, or of the page the change could break) attached to the PR, then commit + push + PR after a single "yes". Use when the user says "ship", "/ship", "ship it", or asks to commit, push and open the PR in one go.
---

# Ship

One confirmation covers commit, push and PR. Everything before it runs without asking; nothing that writes to GitHub runs before it.

## 1. Preflight

- `git status --short` and `git diff main...HEAD --stat` plus the working tree diff: know exactly which files belong to this change. Stray untracked files (notes, proposals, scratch) are never staged.
- On `main`: create a branch first, named after the change (`fix/…`, `feat/…`, `chore/…`).
- `gh pr view --json state,url` on the branch. `MERGED` or `CLOSED`: stop pushing there; propose a new branch from `main` with the commits cherry-picked.
- Risk tier: match the change's files against REVIEW.md → "Risk tiers". Any high path → high, else low. The tier comes from the files, never from how small the diff looks.

## 2. Checks

- `bun run lint` and `bun run typecheck`. Count type errors in the unfiltered output; never `grep -v` it.
- Tests: in each package the change touches, the changed test files first, then that package's whole suite (`bun run --cwd packages/backend test` with `RUN_DATABASE_TESTS=1` and an `elysium_test` database when services or routes changed, `bun run --cwd packages/web test`, `bun run test:harness` for `scripts/`). A fix ships with a test that fails without it. Each test added or touched: break the line it guards, run it, see it fail, restore; a test that stays green is deleted. No e2e: CI runs it, `/watch-pr` handles what fails there.
- Runtime or build inputs touched: `bun run build`.
- UI touched: say so in the summary. The demo (step 3b) covers the screenshot.
- A failure: fix it and rerun, or stop and report it as is. Never ship red.

## 3. Review

- Invoke the `code-review` skill on the branch diff with `--fix`, at `high` on a high tier. It reads CLAUDE.md / AGENTS.md.
- High tier: also invoke the `security-review` skill. Each finding: fix it or skip it with the reason.
- High tier: invoke the `design-critic` skill, unless it already ran on this change at plan time (then reuse its verdict). Its brief is built from the problem the change solves, never from the diff. A **change** verdict is not applied here: it goes in the confirmation for the user to decide; **BACKLOG** items are added to BACKLOG.md.
- Fixes applied: rerun lint + typecheck + the tests.
- If the `ponytail:ponytail-review` skill is installed, invoke it on the branch diff (review only, never auto-applied). Each finding: fix it or skip it with the reason; fixes applied → rerun lint + typecheck.
- Comment sweep (AGENTS.md → "Comments — hard rule"), mandatory: run `bun run lint:comments` (lists every comment the branch adds, working tree included; fails on `ponytail:`), read every hit, delete each comment that fails the rule (narrates the change, restates the code, labels a section, repeats a test title). Only then re-run lint. `ponytail:` comments are always dropped; keep their content only as a plain comment if it names a real ceiling the code can't say.
- Re-read the final diff for the other leftovers: debug code, single-call-site helpers.

## 3b. Demo

Default: a demo. Almost every change reaches a screen: a UI diff, and also an API module, shared schema, query or middleware that a page reads. Skip only when no screen can change: tests only, CI, tooling, docs, or a refactor with no runtime path to a page. Then say "no demo" and why.

What it shows, one of:
- **New UI or feature**: before → action → result.
- **Anything else**: the page(s) that read the changed code, still working. Find them by following the callers from the changed file up to a route; name in the summary which page and why it is the one at risk. A demo of an unrelated page proves nothing.

Format: a video when proving it takes an interaction (click, form, navigation, loading or error state); a screenshot when one static state is enough.

Upload: only the official `gh … --attach` (gh ≥ 2.99, its own OAuth token), and only after the "yes" (step 5). Never a tool that reads browser cookies or the GitHub web session. Accepted: png, jpg, gif, webp, svg (≤ 10 MB), mp4, mov, webm (≤ 100 MB).

- Script the flow in a throwaway Playwright spec `e2e/demo.local.spec.ts` (gitignored, deleted after), with `test.use({ video: { mode: 'on', size: { width: 1280, height: 800 } }, viewport: { width: 1280, height: 800 } })` (drop `video` for a screenshot-only demo) and short `page.waitForTimeout(800)` pauses so each state is readable. Video under 30 s.
  - Before the first `goto`, make clicks visible in the video (Playwright's mouse is invisible):
    ```ts
    await page.addInitScript(() => {
      addEventListener('pointerdown', (event) => {
        const dot = document.createElement('div');
        dot.style.cssText = `position:fixed;left:${event.clientX - 14}px;top:${event.clientY - 14}px;width:28px;height:28px;border-radius:50%;background:rgba(255,40,40,.45);border:2px solid #ff2828;pointer-events:none;z-index:2147483647;transition:transform .5s,opacity .5s`;
        document.documentElement.append(dot);
        dot.getBoundingClientRect();
        dot.style.transform = 'scale(1.8)';
        dot.style.opacity = '0';
        setTimeout(() => dot.remove(), 600);
      }, true);
    });
    ```
    Keep a `waitForTimeout(500)` after each click so the ripple is caught on video.
  - `playwright.config.ts` starts the built Nitro server on port 3100 against `E2E_DATABASE_URL`, so the real API answers: run `bun run build` first and point it at a disposable `elysium_test` / `elysium_e2e` database. Private pages need a signed-up user: reuse the sign-up flow from `e2e/auth-posts.spec.ts`.
- `bunx playwright test e2e/demo.local.spec.ts --project chromium`. The `.webm` lands in `test-results/`.
- Copy the video and screenshots to `/tmp/ship-demo/<branch>/` (`mkdir -p` first; `test-results/` is wiped on the next run).
- Look at each file and check it shows the change or the page at risk working. A run that fails or shows the wrong thing: fix the spec, never ship a misleading demo.

## 4. One confirmation

Show, short:
- risk tier and the paths that set it
- files in the change, lint/typecheck/test results (counts, not logs), e2e left to CI
- review findings (code-review + ponytail-review, + security-review on high): fixed / skipped and why
- comments: `N added, M kept` and the reason for each kept one (units, invariant, quirk, magic value), or "no comment added"
- high tier: design-critic verdict(s) with their axis, or "no design critic: <why>"
- commit title(s), conventional and in English (`fix(web): <effect>`), one per concern
- demo: the files, what each shows, and that they will be attached to the PR; or "no demo" and why
- PR title and a short human-readable body following `.github/pull_request_template.md` (no AI attribution):
  - what changes for the caller, in a few lines
  - `## Testing`: the commands run and their result, one line per break-check (`broke <file:line> → <test> failed`), the demo, what is left to CI
  - `## Risk`: tier, the paths that set it, what could break
  - `## How to revert`: `git revert` of the squash commit, a flag to turn off, or why a plain revert is not enough
- high tier: the files to read yourself before saying yes (the high paths in the diff)

Then ask once: "Ship ? (commit + push + PR)". Anything but a clear yes: stop.

## 5. Ship

- Stage only the change's files by path, commit (no `Co-Authored-By`), `git push -u origin <branch>`. The pre-push hook reruns lint + typecheck.
- Delete `e2e/demo.local.spec.ts`.
- No PR yet: `gh pr create --base main --title … --body … --attach <file>` once per demo file (appended to the body; `'<file>#alt text'` for a screenshot). PR exists and open: the push updates it, then `gh pr comment <n> --body "Demo: <what it shows>" --attach <file>` (never `gh pr edit --body`, it replaces the description).
- `--attach` fails on some file: the PR is still created and its URL printed, exit is non-zero. Never rerun `gh pr create`; retry that file with `gh pr comment --attach` and report it.
- Print the PR URL, then: "Tape `/watch-pr` pour que Claude surveille la CI et les reviews."

## T-2026-09-16-no-grants-home — collapse the no-access home state to one message

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: a USER with zero library grants sees the "no access" explanation
  **once** on `/` instead of three times (one per `HomeRow`), and the right
  rail ("Your week") does not show a 0/0 scoreboard next to it (#666).
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Gate `page-home__layout` (3 rows + rail) behind `hasLibraryAccess`;
        render one `AppNoPermission` block instead when false (same
        component/copy `browse.vue` already uses for the same state — lock
        icon, warning palette, `pages.browse.emptyNoAccess*` keys, no new
        i18n needed)
  - [x] Drop the now-dead `hasLibraryAccess`-ternary branches from the three
        empty-state computeds (title/body) — only reachable when access is
        true now; deleted 2 of the 4 computeds outright (title was a
        constant once the ternary was gone)
  - [x] Updated `index.spec.ts` for the new shape — it asserted the old
        per-row ternaries directly; replaced the two zero-grants tests with
        one "renders a single no-access block, zero `HomeRow`s" test, added
        `AppNoPermission` to the `@app/ui` mock
  - [x] Proposed a "next action" for the no-access block to the maintainer;
        answer was **no button, ever** — refetching resolves nothing (the
        grant not existing isn't a staleness problem), and both real
        next-actions (mailto, request-access) need an endpoint the contract
        doesn't have and are out of scope for this fix. Left explicit as a
        code comment next to the block so the omission reads as deliberate.
        "Request access" filed as its own future feature by the maintainer,
        not tracked here.
  - [x] `pnpm --filter @app/web lint --fix && pnpm format && pnpm stylelint:fix`,
        `turbo run lint test typecheck` (18/18 green, 569/569 web,
        2130/2130+29 backend incl. the contract e2e suite once
        `pnpm spec:bundle` regenerated the missing bundle this fresh
        worktree didn't have), `pnpm check:i18n` clean
  - [x] Verified live: built `courseshelf-web:no-grants-home`, hot-swapped
        the shared `csh-audit` stand's `web` container (project `csh-audit`,
        not the compose file's own `courseshelf-release` — first attempt
        without `-p csh-audit` stood up a disconnected duplicate stack,
        cleaned up). `audit-empty@example.com`: one message, one lock icon,
        no rail, on both `/` and `/browse` (browse unchanged, not this
        lane's file) — screens don't contradict. `audit-admin@example.com`:
        unaffected, still 3 rows + rail + posters. Reverted the stand's
        `web` image back to `audit6` for the other lanes
  - [x] PR #670 opened; CI Playwright caught a real gap —
        `tests/e2e/home.spec.ts` never mocked `/api/v1/libraries`, so a
        non-admin fell through to `hasLibraryAccess === false` against a
        fixture that also mocked non-empty content rows — a persona that
        can't exist for real (content with zero grants). Added a
        one-library fixture (existing tests keep the "has access" persona
        they were written for, renamed the 1440px test to say so) and a
        second, genuinely new test for the zero-grants case, confirmed to
        fail against `main`'s `index.vue` before checking it back to this
        branch's. Ran the full local `pnpm e2e` (backend not started — all
        calls in scope are route-mocked): 34/34 relevant tests green, the
        one `smoke.spec.ts` backend-health failure is the missing backend,
        not this change
  - [x] CI green on #670 after the fixture fix (all checks passed)
- Status: in-progress — PR #670 open and green, awaiting merge
- Blockers: —
- PR: https://github.com/kkucherenkov/course_shelf/pull/670 (merged)

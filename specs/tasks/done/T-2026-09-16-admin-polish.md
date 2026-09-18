## T-2026-09-16-admin-polish — mislabeled navigation, filter-blind empty state, missing confirmations

- Created: 2026-09-16
- Owner: claude
- Goal: heuristic 6 (recognition over recall) + admin-polish's half of the
  confirmation-policy pass, on `apps/web/app/pages/admin/{permissions,identify-tasks}/**`
  and `AdminIdentifyTask*.vue`.
- Sub-steps:
  - [x] #599 — `permissions/[userId].vue`: two buttons labeled for an action
        they don't perform (`errorRetry`/`addGrantCta` both just navigate to
        `/admin/permissions`) get a label naming the actual transition;
        `overridesByLibrary`'s in-flight `getCourse` resolution no longer lets
        the badge count creep up silently — skeleton stays until resolved
  - [x] #600 — `identify-tasks/index.vue` empty state learns about its own
        default `status=proposed` filter (mirrors `browse.vue`'s
        `'filtered'` empty-kind + "show all" action)
  - [x] #606 (admin-polish half) — confirm dialogs for the two heaviest
        unconfirmed actions on this surface: revoking a library grant
        (`handleSetLibrary`, names who/what) and applying an identify task
        (`AdminIdentifyTaskReview`, shows changed-field count)
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck` — all
        green (474 web + 918 ui tests)
- Status: in-progress — PR #611 open, all checks green except one
- Blockers: "Storybook visual regression" fails on PR #611 with 3 drifted
  stories (`AppNavigationShell`, `AppPlayerChrome`, `IconCS`) — none in this
  branch's diff (no `packages/ui` files touched). Confirmed pre-existing:
  the same check already fails on `main` at `ed3653d0` and `a99a7b80` before
  this branch diverged. Out of this lane's file ownership
  (`AppNavigationShell`→`a11y-document`, `AppPlayerChrome`→
  `audit-regressions`, `IconCS` unowned this wave) — flagged to maintainer
  rather than fixed here.
- PR: https://github.com/kkucherenkov/course_shelf/pull/611 (merged)

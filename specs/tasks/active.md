# Active tasks

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

## T-2026-09-16-edit-guard — fix three "UI lies about state" defects

- Created: 2026-09-16
- Owner: claude
- Goal: three issues where the interface asserts something false about
  current state — unguarded metadata-edit exit, two disagreeing "resume"
  algorithms, and a catalog empty-state that blames the wrong actor.
- Sub-steps:
  - [x] #570 — guard unsaved `CourseMetadataForm` edits: `onBeforeRouteLeave` + `beforeunload`, collapse header "Back" / footer "Cancel" to one
        control
  - [x] #573 — course page's `resumeLesson` now reads the same
        `lastSeenLessonId` the home page's continue-watching row uses
        (`useContinueWatching`), falling back to the position heuristic only
        when the course isn't in that list yet
  - [x] #579 — `browse.vue` empty state distinguishes no-grants (AppNoPermission)
        from empty-library (existing copy, admin only) from
        granted-but-empty (new copy, no dead-end CTA); `sign-up.vue` skips
        the library-registration step entirely for a non-first-admin account
        (the backend 403s that call anyway); `index.vue`'s recently-added row
        gets a role-aware empty body to match
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck`
- Status: in-progress
- Blockers: —

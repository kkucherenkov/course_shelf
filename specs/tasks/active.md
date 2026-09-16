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

## T-2026-09-16-audit-regressions — fix regressions from the previous audit-fix wave

- Created: 2026-09-16
- Owner: claude
- Goal: three defects the last wave introduced (#596) plus this lane's half
  of the confirmation-policy inversion (#606) — heuristics 3 (user control)
  and 4 (consistency), audit target 22/40 → 32/40+.
- Sub-steps:
  - [x] #596-1 — `AppPlayerChrome` overlay never returns on tap (no
        `@click`/`@pointerdown` listener). Fixed with one `@click` handler on
        the root: interactive descendants (`button`, `[role="slider"]`,
        `a`, `dialog`) opt out via `closest()`; otherwise idle-hidden →
        reveal, else → toggle play (doubles as the tap-to-play/pause
        affordance the player never had). Verified red before fix.
  - [x] #596-2 — verified against the actual repository (not just the read):
        `findManyByUser` has no `percent`/completion filter, so a finished
        course stays in continue-watching as long as `lastSeenAt` is recent.
        Fixed client-side in `resumeLesson` (backend/`get-continue-watching`
        is outside this lane's owned surface) — `continueWatching` is
        ignored once `courseState === 'completed'`. Verified red before fix.
  - [x] #596-3 — decided: apply `effectiveLessonState` in
        `CourseSectionsList.vue` too (same treatment already reviewed for
        `PlayerSectionsTab.vue`), so the two lesson-badge displays agree.
        `courseState` / "Your week" stay on server truth on purpose — the
        threshold is a display nicety for one row, not a second source of
        truth for course completion. No spec change. Maintainer signed off
        on the decision but required the settings hint to say honestly what
        the threshold does and doesn't affect — rewrote
        `pages.settings.playbackThresholdHelp` (en/ru). Verified red before
        fix.
  - [x] #606 (this lane's half, part 1) — removed the confirm dialog from
        Reset progress (`CourseActions.vue`): own data, fully reversible,
        fires straight through like Mark complete already does. Verified
        red before fix.
  - [x] #606 (this lane's half, part 2) — added a shared confirm dialog for
        Rescan/Transcribe on `courses/[id].vue` (maintainer approved adding
        new `pages.courseDetail.*` locale keys directly — the i18n-ownership
        rule is about editing existing strings, not adding new ones).
        Verified red before fix.
  - [x] #597 — `PlayerSidebar.vue` passed `AppTabs`' `label` (the tablist's
        own accessible name) the same string as the first `AppTab`'s label,
        so a screen reader announced "Sections, tablist, Sections, tab 1 of
        5". Added a distinct `tabsLabel` prop / `sidebarTabsLabel` locale
        key. `AppTabs` itself is `a11y-document`'s surface and was already
        correct — the bug was in this lane's caller. Verified red before fix.
  - [x] `settings.vue:12` — fixed stale "density (3-up picker)" comment (2
        options today)
  - [x] gates: lint, stylelint, format, i18n-parity, `turbo run lint test
typecheck --force` — all green (`@app/web` 475/475, `@app/ui`
        922/922)

## T-2026-09-16-fix-scan-progress-visibility — honest scan progress, one clock, wired buttons

- Created: 2026-09-16
- Owner: claude
- Goal: scan progress card stops lying about state (heuristic 1 — visibility
  of system status). `#593`: percent is hardcoded 0 (no `totalFiles` on
  `ScanDto`, and that's correct — replace with an indeterminate bar + the
  already-existing "files scanned" counter, not a fake percent); the two
  renders of the same running scan (page vs notifier) disagree on
  added/updated/errors; Cancel button has no backing endpoint (`cancelled`
  is v2-reserved per openapi.yaml) — remove it; "N errors" button is
  unwired — wire it to the real `ScanError[]` already on `ScanDto`. `#603`:
  two independent elapsed-time clocks (2s-poll-bound computed vs a separate
  1s timer) drift apart for the same scan — consolidate into one shared
  clock.
- Sub-steps:
  - [x] #593 — remove fake `percent`; indeterminate bar while running, full
        bar on terminal states; fix admin page's hardcoded
        added=0/updated=0/errors=0 to real `liveScan` values; drop dead
        Cancel button + prop/emit from `AppScanProgress`; wire
        `errors-clicked` (admin page: inline error list from
        `liveScan.errors`; notifier: navigate to the library's admin page)
  - [x] #603 — `useElapsedTime` composable: one shared 1s clock used by both
        `useScanProgress` and `ScanLifecycleNotifier`
  - [x] gates: lint, stylelint, format, `turbo run lint test typecheck`
        (@app/web 475/475, @app/ui 918/918, both clean)
- Status: ready for PR
- Blockers: —

# Active tasks

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
- Status: ready for PR
- Blockers: —

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

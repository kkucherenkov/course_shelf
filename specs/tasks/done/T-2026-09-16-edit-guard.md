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
- Status: done
- Completed: 2026-09-16
- Result: [PR #586](https://github.com/kkucherenkov/course_shelf/pull/586) —
  the maintainer squash-merged it seconds before a follow-up commit fixing
  one stale e2e assertion (`tests/e2e/auth.spec.ts`'s "second-user signup"
  case still expected the pre-fix library-step behaviour) could land on the
  same branch; that commit's `pull_request` check never registered against
  an already-closed PR, so it shipped separately as
  [PR #588](https://github.com/kkucherenkov/course_shelf/pull/588).

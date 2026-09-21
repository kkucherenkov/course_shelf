## T-2026-09-16-home-honesty — home page gives two answers to one empty state, uneven revoke confirmation

- Created: 2026-09-16
- Owner: claude
- Goal: two defects of the same class — the interface must not give two
  different answers to the same question. Wave 4 audit, 23/40, scoped to
  `apps/web/app/pages/index.vue` and
  `apps/web/app/pages/admin/permissions/[userId].vue`.
- Sub-steps:
  - [x] #633 — `index.vue`'s "recently added" empty row still branched on
        `userRole === 'ADMIN'` only, unaware of `hasLibraryAccess` (added to
        the two sibling rows by `T-2026-09-16-silent-failures`, #623) — a
        member with zero library grants read "ask an admin to add courses"
        one row below the honest no-access message on continue-watching.
        Three states now, not two: no access (reuses
        `pages.browse.emptyNoAccessTitle/Body` verbatim, same as the
        siblings) → then the existing admin/member split, which only makes
        sense once there's a real library to be a member or admin of. Zero
        new locale keys — reused what #623 already wired.
  - [x] found while verifying live on `audit-empty@example.com` (flagged by
        the assessment, not in either issue): `completedCountLabel`
        (`HomeRow`'s `collapsibleMeta`, rendered in the row's header —
        outside its own `status`-gated body) showed "0 courses" during the
        `pending` fetch. Guarded on `status.value === 'success'`, mirroring
        `browse.vue`'s `subtitle` pattern.
  - [x] not touched: `CourseWideCard`'s `resumeLabel` (continue-watching
        "Section 3 · Lesson 7" instead of "34% · 12/40") — traced the
        existing wiring on `courses/[id].vue` (`primaryCTALabel` /
        `resumePosition`) back to `CourseOutlineSummary.sections`; the home
        page's `ContinueWatchingItem` DTO carries only `lastSeenLessonId`
        (an id, no section/lesson number or title) — building this label
        needs a DTO field that doesn't exist. Flagged to maintainer per
        their own stated boundary, not implemented here.
  - [x] admin/permissions/[userId].vue: course-scope grant revoke
        (`@set-course` → `handleSetCourse` directly) fired with no
        confirmation, inconsistent with the library-scope revoke's dialog
        (#606). Generalized the existing `pendingRevokeLibraryId`/
        `revokeDialogOpen` pair into one `pendingRevoke: {kind, id} | null`
        state shared by both rows (`requestSetLibrary`/`requestSetCourse` →
        `requestRevoke` → one `AppDialog`, one confirm/cancel pair) — second
        caller, not a second dialog. Course title for the dialog is a free
        byproduct of the `getCourse` call `ensureCourseLibraryResolved`
        already makes per granted course (#576) — no second fetch. New
        locale key `revokeDialogTitleCourse` (en/ru) since the existing
        `revokeDialogTitle`'s Russian text hardcodes "к библиотеке" (to the
        library) and can't be reused verbatim for a course.
  - [x] tests: `index.spec.ts` extended (3-state matrix on recently-added,
        pending-vs-loaded `collapsibleMeta`); `admin-permissions-user.spec.ts`
        extended (course revoke confirm + cancel, mirroring the existing
        library-revoke pair). Every new/changed assertion confirmed red
        against a `git checkout --` of the pre-fix page file before
        restoring the fix (patch saved and reapplied, not a raw revert).
  - [x] gates: `pnpm design:build` (generated tokens were missing in this
        fresh worktree), lint --fix, stylelint:fix, format, `pnpm
check:i18n`, `pnpm exec turbo run lint test typecheck --filter=@app/web
        --filter=@app/ui` — all green (`@app/web` 563/563, 9/9 turbo tasks)
  - [x] live-stand check — not on the shared `:8090` stand (frozen at
        `417c5cbb`, predates this fix); built this worktree's own isolated
        compose stack instead (`csh-homehonesty-verify-*`, torn down after,
        mirrors `nav-and-keys`' approach). Signed up a fresh admin (`/setup`)
        and a fresh zero-grant member (`/sign-up`) — confirmed by eye: all
        three home rows read identically ("No courses available to you yet"
        / "You have not been granted access to a course library. Ask an
        administrator to grant you access."); granted then revoked a
        course-scope grant on `/admin/permissions/[userId]` as the admin —
        confirmed the dialog now reads `Revoke access to "Seed course —
fundamentals" from Member Zero?` before it fires.
- Status: done
- Blockers: —
- Completed: 2026-09-16
- Result: https://github.com/kkucherenkov/course_shelf/pull/637
  lane's scope)
- PR: https://github.com/kkucherenkov/course_shelf/pull/637 (merged)

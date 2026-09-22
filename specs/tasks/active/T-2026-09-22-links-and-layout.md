## T-2026-09-22-links-and-layout — Make rows real links, fix layout traps the 1.9.0 audit found

- Created: 2026-09-22
- Owner: claude
- Spec: pre-release audit run20 (`assessment-a.md` findings 6, 9, 10, 14;
  `synthesis.md` empty-table-header)
- Goal: sidebar and lesson rows are real `<a href>` elements a browser can
  middle-click, ctrl/cmd-click, or copy; admin actions and the player tab row
  stay reachable/legible at 390px; mark-complete cannot close a 540-lesson
  course in one click; the one genuine axe finding on `/admin` is fixed.
- Acceptance:
  - a lesson row and every sidebar nav item render as `<a href="...">`
    (verified via `AppRow`/`AppLessonRow` `to` prop + unit tests)
  - `/courses/<id>` admin-actions row wraps instead of running off-screen at
    390px
  - the player's tab row (Разделы/Заметки/Закладки/Материалы) scrolls
    horizontally instead of wrapping the active tab onto a second line
  - "Отметить пройденным" opens a confirm dialog naming the lesson count
  - `/admin`'s two decorative `<th>` cells carry screen-reader-visible text,
    not just `aria-label` (axe `empty-table-header` requires visible text)
- Spec diff: none
- Codegen impact: no
- Design impact: `AppRow`/`AppLessonRow` gain an optional `to` prop
  (`RouteLocationRaw`, same pattern as the existing `AppButton.to`); no new
  component
- Tests: `AppRow.spec.ts`, `AppLessonRow.spec.ts`, `AppNavigationShell.spec.ts`,
  `CourseSectionsList.spec.ts`, `course-detail-mark-complete-confirm.spec.ts`
  (new), `AdminScansTable.spec.ts` snapshot refresh
- Sub-steps:
  - [x] `AppRow`: `to` prop → renders `NuxtLink` (mirrors `AppButton.to`)
  - [x] `AppLessonRow`: same `to` prop, locked/loading rows stay non-link
  - [x] `AppNavigationShell`: wire `:to="item.to"` on all 4 nav-row call sites
  - [x] `CourseSectionsList`: `courseId` prop, `:to` per lesson row, drop the
        now-dead `onSelectLesson`/`navigateTo` wiring in `courses/[id].vue`
  - [x] `AppTab`: `flex-shrink: 0; white-space: nowrap` so labels never wrap
  - [x] `PlayerSidebar`: tab row scrolls (`overflow-x: auto`) instead of
        wrapping (#696 wrap → #782 scroll)
  - [x] `courses/[id].vue`: admin-actions row `flex-wrap: wrap` (390px)
  - [x] `courses/[id].vue`: mark-complete routed through the existing
        rescan/transcribe/reset confirm dialog, lesson count in the copy
  - [x] `AdminScansTable`: sr-only span replaces `aria-label` on the two
        empty `<th>` cells
  - [x] Storybook stories for the new `to`/`Link` variants — 2 new baselines
        regenerated via `regen-snapshots.yml` (192b4587), zero drift on
        unrelated components
  - [x] `pnpm --filter @app/ui lint --fix`, `pnpm --filter @app/web lint --fix`,
        `pnpm stylelint:fix`, `pnpm format`
  - [x] `pnpm --filter @app/ui test`, `pnpm --filter @app/web test`,
        `pnpm check:i18n`
  - [x] Open PR (https://github.com/kkucherenkov/course_shelf/pull/787), wait
        for required CI checks
- Status: in-progress
- Blockers: —

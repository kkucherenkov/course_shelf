# Active tasks

## T-2026-09-18-fix-speed-menu — playback-speed menu keyboard behaviour + lock/error close

- Created: 2026-09-18
- Owner: claude
- Goal: the speed menu (`AppPlayerChrome`) behaves like the `role="menu"` it
  advertises — arrow-key/Home/End roving focus, focus moves in on open, closes
  on outside click (tuxedo 235) — and auto-closes (plus stops accepting picks)
  when the player goes `locked`/`error` mid-session (tuxedo 236).
- Spec diff: none — visual-only component, no contract change
- Codegen impact: no
- Sub-steps:
  - [x] focus moves onto the checked (or first) row when the menu opens
  - [x] ArrowUp/ArrowDown/Home/End roving focus among menu rows
  - [x] outside click closes the menu (reuses the existing focus-return path)
  - [x] `isInert` watcher closes an already-open menu on lock/error
  - [x] `chooseSpeed` guards on `isInert`, rows get `:disabled="isInert"`
  - [x] spec coverage + Storybook story pass
- Status: in-progress
- Blockers: —

## T-2026-09-18-browse-controls-stack — stop the browse filters moving between locales

- Created: 2026-09-18
- Owner: claude
- Goal: the filter group sits in the same place in every language.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] e2e guard: the selects start below the chips in en and ru alike
  - [x] stack `.page-browse__controls` into a column
- Status: in-progress
- Blockers: —

## T-2026-09-18-fix-course-grant-access — course-level grant reads as no access on Home/Browse

- Created: 2026-09-18
- Owner: claude
- Spec: —
- Goal: a learner holding only a COURSE-level grant sees the catalogue on
  Home and Browse instead of the access-denial screen. `GET /libraries` only
  lists library-level grants (`AuthorizationService.canSee`'s library ⇒
  course implication does not run in reverse), so it went empty for a
  course-only grant and both pages read that as "no access at all" — a
  regression from the 579/666/701 wave, confirmed in the 1.8.1 audit
  (tuxedo 249).
- Spec diff: none — client-only fix, no wire contract change.
- Codegen impact: no
- Sub-steps:
  - [x] trace root cause (`AuthorizationService.canSee` grant asymmetry)
  - [x] `useCourseCatalogAccess` — unfiltered `GET /courses` probe in `useCoursesList.ts`
  - [x] `browse.vue` / `index.vue` — union libraries-probe with courses-probe, rename `hasLibraryAccess` → `hasCatalogAccess`
  - [x] update `browse.spec.ts` / `index.spec.ts` for the new signal + regression case
  - [x] cover the course-grant case in `tests/e2e/browse.spec.ts`
  - [x] rebase onto main (PR #715 lands first) before opening the PR
- Status: in-progress
- Blockers: —

## T-2026-09-17-lesson-summary-export — lesson summary with screenshots, Markdown export

- Created: 2026-09-17
- Owner: claude
- Spec: [docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md](../../docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md)
- Goal: a lesson leaves the app as a ZIP you can drop into a notes vault — summary, slides, note, bookmarks.
- Spec diff: openapi.yaml — summary routes, export routes, signed frame route
- Codegen impact: yes
- Sub-steps:
  - [x] design pre-step (settles E28-F01-S01's first sub-step)
  - [x] ADR-0012: hosted model provider, supersedes ADR-0011
  - [ ] roadmap card for the summary feature under E29
  - [x] hosted model adapter + AppConfig
  - [ ] FfmpegAdapter: widen thumbnail dimensions, add scene extraction
  - [ ] LessonSummary aggregate, routes, admin review screen
  - [ ] renderer + ZIP export + web entry point (E28-F01-S01)
- Status: in-progress
- Blockers: —

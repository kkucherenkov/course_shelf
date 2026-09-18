## T-2026-09-14-admin-course-access — an admin fixing a bad import cannot reach a single course from admin

- Created: 2026-09-14
- Owner: claude
- Spec: none — `#510`; no HTTP contract change, `listCourses` already accepts
  `libraryId` and "admins see all"
- Goal: from `admin/libraries/:id`, an admin can reach any course in that
  library in one click, landing on the existing `courses/:id` page that
  already carries Rescan/Resync/Transcribe.
- Decision (the fork the issue names): library detail page links straight
  into the existing course pages (option 2, issue's own "far cheaper and
  probably enough"), not a new admin course list surface. Reuses
  `useCoursesList({ libraryId })` (already supports the filter, already used
  by Browse) — no new composable, no new endpoint.
- Acceptance:
  - `admin/libraries/:id` shows every course in the library, each linking to
    `/courses/:id`.
  - Loading skeleton while fetching; empty state when the library has zero
    courses.
  - `ru` locale renders.
- Spec diff: none
- Codegen impact: no
- Design impact: none — new component lives in `apps/web/app/components/admin/`
  (page-specific, like `AdminScansTable`), not `@app/ui`.
- Tests: unit spec for the new `AdminCourseList.vue` (colocated, mirrors
  `AdminScansTable.spec.ts`).
- Sub-steps:
  - [x] plan
  - [x] `AdminCourseList.vue` + colocated spec
  - [x] wire into `admin/libraries/[id].vue` via `useCoursesList({ libraryId })`
  - [x] i18n keys (en + ru)
  - [x] lint/format/typecheck/test gates
  - [x] open PR with `Closes #510` — [#540](https://github.com/kkucherenkov/course_shelf/pull/540)
- Status: done
- Completed: 2026-09-14

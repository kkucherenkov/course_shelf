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
- Status: done
- Blockers: —
- Completed: 2026-09-18
- Result: https://github.com/kkucherenkov/course_shelf/pull/719

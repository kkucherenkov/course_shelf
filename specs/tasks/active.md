# Active tasks

## T-2026-09-16-hero-poster — course page hero never renders the poster

- Created: 2026-09-16
- Owner: claude
- Goal: `/courses/:id` shows the accent block instead of the downloaded
  poster, even though the poster renders fine in `browse.vue`/`index.vue`/
  `search.vue`.
- Root cause (deeper than first reported): the course-detail page reads
  `CourseOutlineSummary` (via `GET /courses/{id}/outline`), a DTO distinct
  from `CourseDto` (via `GET /courses`, used by the list pages).
  `CourseOutlineSummary` never carried `posterUrl` at all — not a frontend
  bug, a missing field on the wire contract this endpoint was never given.
- Spec diff: `openapi.yaml` — add `posterUrl` to `CourseOutlineSummary`.
- Codegen impact: yes.
- Sub-steps:
  - [x] add `posterUrl` to `CourseOutlineSummary` in openapi.yaml
  - [x] spec:validate / spec:bundle / spec:codegen
  - [x] `get-course-outline.handler.ts` — inject `CoursePosterTokenSigner`, set `posterUrl` (same pattern as `get-course.handler.ts`)
  - [x] `CourseHero.vue` — background from `course.posterUrl` else `COVER[accent]`
  - [x] tests: handler spec + CourseHero spec (poster present / absent) — both confirmed red before the fix
  - [x] gates: lint/test/typecheck/stylelint/format green for backend + web + api-client-ts + specs; i18n parity unaffected (no new strings)
- Status: in-progress (PR not yet opened)
- Blockers: —

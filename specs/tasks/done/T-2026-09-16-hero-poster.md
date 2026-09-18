## T-2026-09-16-hero-poster — course page hero never renders the poster

- Created: 2026-09-16
- Owner: claude
- Spec: none — bug fix reported by the maintainer from a production screenshot,
  no tracked issue.
- Goal: `/courses/:id` showed the flat accent block instead of the downloaded
  poster, even though the same course showed its poster fine in
  `browse.vue`/`index.vue`/`search.vue`.
- Root cause (one layer deeper than first reported): the course-detail page
  reads `CourseOutlineSummary` (via `GET /courses/{id}/outline`), a DTO
  distinct from `CourseDto` (via `GET /courses`, used by the list pages).
  `CourseOutlineSummary` never carried `posterUrl` at all — not a frontend
  bug ignoring data that arrived, a missing field on a wire contract that was
  never given it.
- Spec diff: `openapi.yaml` — added `posterUrl` to `CourseOutlineSummary`.
- Codegen impact: yes — `@app/api-client-ts`, `@app/api-client-dart`.
- Sub-steps:
  - [x] add `posterUrl` to `CourseOutlineSummary` in openapi.yaml
  - [x] spec:validate / spec:bundle / spec:codegen
  - [x] `get-course-outline.handler.ts` — inject `CoursePosterTokenSigner`, set `posterUrl` (same pattern as `get-course.handler.ts`)
  - [x] `CourseHero.vue` — background from `course.posterUrl` else `COVER[accent]`
  - [x] tests: handler spec + CourseHero spec (poster present / absent) — both confirmed red before the fix
  - [x] gates: lint/test/typecheck/stylelint/format green for backend + web + api-client-ts + specs; i18n parity unaffected (no new strings)
- Status: done
- Completed: 2026-09-16
- Result: [PR #564](https://github.com/kkucherenkov/course_shelf/pull/564)

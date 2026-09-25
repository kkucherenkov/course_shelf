## T-2026-09-25-search-denial-and-lesson-count — stop /search and /admin/libraries stating things they have not checked

- Created: 2026-09-25
- Owner: claude
- Spec: [#807](https://github.com/kkucherenkov/course_shelf/issues/807), [#808](https://github.com/kkucherenkov/course_shelf/issues/808)
- Goal: neither page may present an unanswered question as a settled negative answer.
- Acceptance:
  - A user whose catalog probe fails with 429 or 5xx sees the search page, not "no access"
  - A course whose lesson total is unknown shows no lesson count, rather than "0 lessons"
  - The library detail page never contradicts its own "Lessons 5973" panel
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: existing web vitest suite; the change is a guard, verified by typecheck and the audit rerun
- Sub-steps:
  - [x] `/search`: treat a failed probe as inconclusive, not as a denial
  - [x] `/admin/libraries/{id}`: omit the lesson label when the total is 0
  - [ ] gates green, PR opened with both `Closes` lines
- Status: in-progress
- Blockers: —

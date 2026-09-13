# Active tasks

_No active tasks._
## T-2026-09-13-e32-course-rescan — rescan a single course

- Created: 2026-09-13
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S02.md](../../docs/roadmap/tasks/E32-F01-S02.md)
- Goal: `POST /api/v1/courses/{id}/rescan` — re-import one course without a full library walk; orphan cleanup scoped so it never touches other courses.
- Spec diff: openapi.yaml — new route
- Codegen impact: yes
- Sub-steps:
  - [ ] OpenAPI + codegen (own commit)
  - [ ] Scope on `RunScanCommand` + handler
  - [ ] Scope-aware orphan cleanup
  - [ ] Rescan button on the course page
  - [ ] Tests, including "other courses untouched"
- Status: in-progress
- Blockers: — (card 1 landed as [PR #463](https://github.com/kkucherenkov/course_shelf/pull/463), branching off it now)

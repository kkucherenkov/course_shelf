## T-2026-09-22-export-and-scraper-spec — Add lesson/course export routes, widen scraper inventory

- Created: 2026-09-22
- Owner: claude
- Spec:
  - [E28-F01-S01](../../../docs/roadmap/tasks/E28-F01-S01.md) —
    [lesson-summary-and-export design §6, §7](../../../docs/superpowers/specs/2026-09-17-lesson-summary-and-export-design.md)
  - [E30-F01-S02](../../../docs/roadmap/tasks/E30-F01-S02.md)
- Goal: specify the two GET-bytes export routes and widen the scraper
  inventory response so two waiting implementation lanes can start against a
  settled contract.
- Acceptance:
  - `GET /api/v1/lessons/{lessonId}/export` and
    `GET /api/v1/courses/{courseId}/export` return `application/zip`, same
    auth/grant/error shapes as `getLesson`/`getCourse`
  - `ScraperInfoDto` carries `origin` (built-in vs definition-file) and a
    nullable `loadError`; the stale "always true" claim on `configured` is
    corrected
- Spec diff: openapi.yaml — two new paths (`exportLesson`, `exportCourse`),
  `ScraperInfoDto`/`ScraperListDto` widened, new `ScraperOrigin` enum schema
- Codegen impact: yes — regenerate api-client-{ts,dart}
- Design impact: none
- Tests: none (spec-only lane; contract tests land with the implementation)
- Sub-steps:
  - [x] Edit openapi.yaml — export routes
  - [x] Edit openapi.yaml — scraper inventory widening
  - [x] spec:validate / spec:bundle / spec:codegen
  - [ ] Open PR, land codegen artefacts in their own commit
  - [ ] Wait for required CI checks
- Status: in-progress
- Blockers: —

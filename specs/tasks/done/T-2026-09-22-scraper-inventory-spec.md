## T-2026-09-22-scraper-inventory-spec — Widen the scraper inventory response

- Created: 2026-09-22
- Owner: claude
- Spec: [E30-F01-S02](../../../docs/roadmap/tasks/E30-F01-S02.md)
- Goal: widen `GET /api/v1/admin/scrapers` so an admin can see a scraper's
  origin and load error without reading container logs, settled as a contract
  the E30-F01-S02 implementation lane can build against.
- Acceptance:
  - `ScraperInfoDto` carries `origin` (built-in vs definition-file) and a
    nullable `loadError`; the stale "always true" claim on `configured` is
    corrected
  - `origin`/`loadError` are optional, not required — the handler that
    predates this widening (`listScrapers` in
    `catalog-scrape-admin.controller.ts`) still type-checks and validates
    against the schema until E30-F01-S02 fills them in
- Spec diff: openapi.yaml — `ScraperInfoDto`/`ScraperListDto` widened, new
  `ScraperOrigin` enum schema
- Codegen impact: yes — regenerate api-client-{ts,dart}
- Design impact: none
- Tests: none (spec-only lane; contract tests land with the implementation)
- Sub-steps:
  - [x] Edit openapi.yaml — scraper inventory widening
  - [x] spec:validate / spec:bundle / spec:codegen
  - [x] Open PR (#761)
  - [x] Drop the export routes originally scoped into this lane — a path
        with no controller can't satisfy the Schemathesis contract test
        (`Missing header not rejected: 404 when missing Authorization,
expected 401`, `validateSecurity: false` means auth is enforced by a
        guard that doesn't exist yet). They move into the E28-F01-S01
        implementation lane instead, landed with their controller in one PR.
        Saved to
        `/tmp/claude-1000/-home-kkucherenkov-projects-petProjects-course-shelf/95efa642-b094-4314-b33b-5b4ad47cc481/scratchpad/export-routes.yaml`
        for that lane.
  - [x] Wait for required CI checks
- Status: done
- Blockers: —
- Completed: 2026-09-22
- Result: https://github.com/kkucherenkov/course_shelf/pull/761

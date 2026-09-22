## T-2026-09-22-scraper-inventory — Surface scraper load errors in the admin UI

- Created: 2026-09-22
- Owner: claude
- Spec: [E30-F01-S02](../../../docs/roadmap/tasks/E30-F01-S02.md)
- Goal: an admin can see which scrapers loaded, which were rejected, and why,
  without reading container logs.
- Acceptance:
  - `GET /api/v1/admin/scrapers` reports every configured scraper, its origin
    (built-in or definition file), and any load error, using the schema #761
    already landed
  - `apps/web/app/pages/admin/scrapers.vue` lists them with the rejection
    reason where present, strings via `t()` in `en`/`ru`
- Spec diff: none — #761 landed `ScraperInfoDto.origin`/`loadError` already;
  this lane only implements against it
- Codegen impact: no
- Design impact: none — reuses existing `@app/ui` components
- Tests: `catalog-scrape-admin.controller.spec.ts` (rejected-definition case),
  `scraper.registry.spec.ts` (origin/rejected), `scrapers.vue` component spec
- Sub-steps:
  - [x] Retain loader errors on `DefaultScraperRegistry`; thread through
        `build-scraper-registry.ts`
  - [x] Widen `listScrapers()` to emit `origin`/`loadError` for loaded and
        rejected scrapers
  - [x] Admin screen `apps/web/app/pages/admin/scrapers.vue` + spec
  - [x] i18n keys in `en`/`ru`, `pnpm check:i18n` green
  - [x] Roadmap bookkeeping: card sub-steps, `TODO.md` row, regenerate
        `ROADMAP.md` (`--roadmap-only`)
  - [x] Open PR, `Closes #238` and `Closes #489`
  - [x] Wait for required CI checks
- Status: done
- Blockers: —
- Completed: 2026-09-22
- Result: https://github.com/kkucherenkov/course_shelf/pull/765

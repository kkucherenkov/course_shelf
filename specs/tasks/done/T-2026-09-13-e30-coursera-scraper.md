## T-2026-09-13-e30-coursera-scraper — Coursera scraper over the open catalog API

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/451
- Owner: claude
- Spec: [E30-F02-S01](../../docs/roadmap/tasks/E30-F02-S01.md)
- Goal: fill a Coursera course's metadata from the platform's own keyless JSON
  catalogue (courses.v1 / instructors.v1 / partners.v1), not its HTML.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: 7 new unit tests for `CourseraScraper` against recorded fixtures + 2
  updated `build-scraper-registry.spec.ts` id lists. Full backend suite: 181
  files / 1872 tests green.
- Sub-steps:
  - [x] `CourseraScraper` + fixtures
  - [x] Registry wiring (`build-scraper-registry.ts`, before declarative defs
        and the `json-ld` fallback)
  - [x] Tests (recorded fixtures, no live network)
  - [x] `docs/user-guide.md` note
  - [x] card + GitHub issue (#450) bookkeeping
- Status: done
- Blockers: —
- Fills 8 of the fragment's 12 fields — `workload` is fetched (matches the
  measured request) but has no home in `ScrapedCourseFragment`, so it is
  discarded.

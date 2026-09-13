# Active tasks

## T-2026-09-13-e30-coursera-scraper — Coursera scraper over the open catalog API

- Created: 2026-09-13
- Owner: claude
- Spec: [docs/roadmap/tasks/E30-F02-S01.md](../../docs/roadmap/tasks/E30-F02-S01.md)
- Goal: fill a Coursera course's metadata from the platform's own keyless JSON
  catalogue (courses.v1 / instructors.v1 / partners.v1), not its HTML.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [ ] `CourseraScraper` + fixtures
  - [ ] Registry wiring (`build-scraper-registry.ts`, before declarative defs
    and the `json-ld` fallback)
  - [ ] Tests (recorded fixtures, no live network)
  - [ ] `docs/user-guide.md` note
- Status: in-progress
- Blockers: —

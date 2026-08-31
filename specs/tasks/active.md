# Active tasks

## T-2026-08-31-e2e-seed-data — give the e2e stack seed data the contract test can reach

- Created: 2026-08-31
- Owner: claude (backend-engineer, lane L7)
- Spec: none — `tuxedo` 27; GitHub issue #441 opened with the PR.
- Goal: `pnpm db:seed` points at a file that does not exist, so `db:seed` and
  `db:reset` both fail, and the Schemathesis contract test never reaches a real
  row on any of the 40 path-parameter operations.
- Spec diff: none for the mechanism — that turned out to be `schemathesis.toml`
  parameter overrides, not OpenAPI `example`s or `links` (see PR #442). The
  openapi.yaml edits that did land are the drift the newly-reachable handlers
  exposed: an int4 bound on `positionSeconds`/`durationSeconds`, `minProperties`
  on the bookmark patch, `pattern: "\S"` across every free-text field whose
  aggregate trims before checking emptiness, ASCII-only `ExternalIdRef.url`, and
  422 documented on three operations.
- Codegen impact: yes — regenerated, in its own commits
- Sub-steps:
  - [x] prove which mechanism actually gates the path-parameter operations
  - [x] write the seed against the domain aggregates + repositories
  - [x] point `db:seed` / `db:reset` at it
  - [x] pin the seeded ids in `packages/specs/schemathesis.toml`
  - [x] run the seed in `e2e.yml` between Playwright and Schemathesis
  - [x] unit test for the seed's data shape
  - [x] fix the five defects the seeded run surfaced (a 500 on an int4 overflow,
        `format: date` never really validated, and three 422s on schema-valid
        input)
  - [x] stop the run fetching the internet (`SCRAPERS_MODE=mock`) and stop it
        cascade-deleting its own fixtures
- Status: in-review — PR #442
- Blockers: —

# Active tasks

## T-2026-08-31-e2e-seed-data — give the e2e stack seed data the contract test can reach

- Created: 2026-08-31
- Owner: claude (backend-engineer, lane L7)
- Spec: none — `tuxedo` 27; GitHub issue #441 opened with the PR.
- Goal: `pnpm db:seed` points at a file that does not exist, so `db:seed` and
  `db:reset` both fail, and the Schemathesis contract test never reaches a real
  row on any of the 40 path-parameter operations.
- Spec diff: none — the lever turned out to be `schemathesis.toml` parameter
  overrides, not OpenAPI `example`s or `links` (see PR #442).
- Codegen impact: no
- Sub-steps:
  - [x] prove which mechanism actually gates the path-parameter operations
  - [x] write the seed against the domain aggregates + repositories
  - [x] point `db:seed` / `db:reset` at it
  - [x] pin the seeded ids in `packages/specs/schemathesis.toml`
  - [x] run the seed in `e2e.yml` between Playwright and Schemathesis
  - [x] unit test for the seed's data shape
- Status: in-review — PR #442
- Blockers: —

# Active tasks

## T-2026-08-31-002 — small-fixes batch: pg_dump in dev, Redocly warnings, docs, done.md

- Created: 2026-08-31
- Owner: claude (backend-engineer, lane L4)
- Spec: GitHub #318, #274, #272
- Goal: four independent small fixes, one PR.
  - #318: `pg_dump` missing from `apps/backend/Dockerfile.dev`, so Admin →
    Backups answers 503 in every dev stack.
  - #274: 4 `no-required-schema-properties-undefined` warnings in
    `ScrapePreviewRequest`; plus find out why `getCourseDownloadEstimate` and
    `recordLessonProgressBatch` look uncalled (investigate only).
  - #272: drop the stale fvm entry from `docs/troubleshooting.md`, sweep the
    rest of the file against CLAUDE.md's "fix belongs in the config" rule.
  - no issue: `specs/tasks/done.md` — entries `T-2026-08-30-019` and `-018`
    have no body and `-017` carries all three.
- Spec diff: openapi.yaml — `ScrapePreviewRequest` only, no contract change
- Codegen impact: expected none; verified by inspecting the regenerated diff
- Sub-steps:
  - [ ] #318 — `postgresql18-client` in `Dockerfile.dev` (prod already has it)
  - [ ] #274 — silence the 4 warnings without disabling the rule
  - [ ] #274 — spec:validate / bundle / codegen, codegen in its own commit
  - [ ] #274 — report on the two "uncalled" operations
  - [ ] #272 — troubleshooting.md sweep; READMEs verified, left alone
  - [ ] done.md — reattach the three bodies to their entries
- Status: in-progress
- Blockers: —

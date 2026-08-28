# Active tasks

## T-2026-08-29-003 — E23-F02-S02 · seed the ADR log with ten entries

- Created: 2026-08-29
- Owner: claude
- Branch: `docs/seed-adrs`
- Card: [E23-F02-S02](../../docs/roadmap/tasks/E23-F02-S02.md)
- Goal: record the _why_ of ten load-bearing decisions so they stop being
  re-litigated, and correct the one the roadmap has backwards.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] ten ADRs under `docs/adr/`, MADR 4.0, each grounded in the tree
  - [x] ADR-0008 rewritten from the carded "SQLite default" to Postgres-only
  - [x] index table in `docs/adr/README.md`
  - [x] relative-link check (34 links resolve)
- Status: in-progress
- Blockers: —

_Remaining follow-up (not carded): per-lesson download state + tap-to-enqueue
once **E19** `DownloadsBloc` lands (#101)._

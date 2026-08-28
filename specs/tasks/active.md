# Active tasks

## T-2026-08-29-004 — E21-F01-S02 · POST /admin/backups

- Created: 2026-08-29
- Owner: claude
- Branch: `feat/admin-backups`
- Card: [E21-F01-S02](../../docs/roadmap/tasks/E21-F01-S02.md)
- Goal: an admin can take a metadata-database snapshot and download it from a
  link that does not need an `Authorization` header.
- Spec diff: `openapi.yaml` — `POST /api/v1/admin/backups` + `BackupCreatedDto`
- Codegen impact: yes
- Design impact: none — no backup surface exists in the design bundle or in any
  web card, so this is API-only.
- Decisions taken with the user before coding:
  - `pg_dump` via `execFile`, with `postgresql18-client` added to the backend
    runtime image (it is not there today) and an explicit version gate rather
    than a silently partial archive.
  - A separate `BackupTokenSigner` in the admin domain rather than extending
    `StreamTokenSigner` (wrong bounded context) or refactoring it (live
    security path).
- Sub-steps:
  - [x] spec: `POST /api/v1/admin/backups`, `BackupCreatedDto`, 503 cases
  - [x] `pnpm spec:validate && spec:bundle && spec:codegen`
  - [ ] `BackupTokenSigner` + errors
  - [ ] `pg_dump` adapter with version gate and timeout
  - [ ] `CreateBackupHandler` + controller route + binary download route
  - [ ] `postgresql18-client` in `apps/backend/Dockerfile`
  - [ ] tests
- Status: in-progress
- Blockers: —

_Remaining follow-up (not carded): per-lesson download state + tap-to-enqueue
once **E19** `DownloadsBloc` lands (#101)._

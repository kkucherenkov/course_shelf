# Active tasks

## T-2026-08-30-009 — E31-F01-S01 finish the browse filters

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/roadmap/tasks/E31-F01-S01.md](../../docs/roadmap/tasks/E31-F01-S01.md) · GH #239
- Goal: library / duration-bucket / instructor filters and sort-by-duration on
  `/browse`, with the whole filter set surviving a reload through the query
  string. Removes the "Browse filters incomplete" row from the Known limits.
- Spec diff: openapi.yaml — `GET /api/v1/courses` gains `durationBucket` and
  `instructorId` query params, and `sort` gains a `duration` value. Audited
  first: `libraryId`, `status` and `sort` (3 values) already existed, the other
  three did not, and `CourseDto` carries no duration at all — so a client-side
  filter over the full list is not even possible.
- Codegen impact: yes (query param types, TS + Dart)
- Sub-steps:
  - [ ] audit which filter parameters the API already accepts
  - [ ] openapi.yaml: `durationBucket`, `instructorId`, `sort=duration`
  - [ ] `pnpm spec:validate && spec:bundle && spec:codegen` (own commit)
  - [ ] backend: ListCoursesQuery/Handler filter + sort by aggregated lesson duration
  - [ ] web: library / duration / instructor selects + duration sort on `/browse`
  - [ ] web: query-string persistence for every filter
  - [ ] locale keys in en + ru
  - [ ] remove the Known-limits row
- Status: in-progress
- Blockers: —

## T-2026-08-30-010 — E31-F01-S02 backups UI

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/roadmap/tasks/E31-F01-S02.md](../../docs/roadmap/tasks/E31-F01-S02.md) · GH #240
- Goal: an admin screen that takes a metadata backup and offers the existing
  signed short-lived download link, with the in-progress and failure states
  visible. Removes the "Backups have no UI" row from the Known limits.
- Spec diff: none — `POST /api/v1/admin/backups` and the signed download route
  have existed since E21.
- Codegen impact: no
- Sub-steps:
  - [ ] `useAdminBackup` composable over `createBackup`
  - [ ] `/admin/backups` page + nav entry + spec covering the three states
  - [ ] locale keys in en + ru
  - [ ] remove the Known-limits row
- Status: in-progress
- Blockers: —

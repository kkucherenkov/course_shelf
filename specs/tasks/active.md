# Active tasks

## T-2026-09-13-e32-lesson-position — lesson position must be unique within its section

- Created: 2026-09-13
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S01.md](../../docs/roadmap/tasks/E32-F01-S01.md)
- Goal: stop the scanner from silently dropping lessons whose computed position collides; fold in tuxedo 118 (Int32 size overflow) and stuck-`running` scans since both share `run-scan.handler.ts`.
- Spec diff: none
- Codegen impact: no
- Schema impact: yes — `DiscoveredFile.size` / `Lesson.sizeBytes` → `BigInt`
- Sub-steps:
  - [x] `assignLessonPositions()` — rank-based position assignment, no per-file collisions possible
  - [x] Trailing-digit ordinal tier in `folder-name.parser.ts`
  - [x] Handler tests per measured shape (23 / 128 / 49) + collision backstop + BigInt smoke test
  - [x] `DiscoveredFile.size` / `Lesson.sizeBytes` → `BigInt` + migration + repo mapping
  - [x] Crash path records cause as `ScanError`, reaches `status=failed` (no more stuck-`running`)
  - [x] lint / format / typecheck / backend test suite green
  - [ ] Open PR 1
- Status: in-progress
- Blockers: —

## T-2026-09-13-e32-course-rescan — rescan a single course

- Created: 2026-09-13
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S02.md](../../docs/roadmap/tasks/E32-F01-S02.md)
- Goal: `POST /api/v1/courses/{id}/rescan` — re-import one course without a full library walk; orphan cleanup scoped so it never touches other courses.
- Spec diff: openapi.yaml — new route
- Codegen impact: yes
- Sub-steps:
  - [ ] OpenAPI + codegen (own commit)
  - [ ] Scope on `RunScanCommand` + handler
  - [ ] Scope-aware orphan cleanup
  - [ ] Rescan button on the course page
  - [ ] Tests, including "other courses untouched"
- Status: blocked
- Blockers: waits on T-2026-09-13-e32-lesson-position's PR to land first (stacked branch)

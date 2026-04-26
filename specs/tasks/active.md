# Active tasks

## T-2026-04-26-024 — Notes endpoints (E09-F02-S02)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E09-F02-S02.md` — Learning F02 second slice. Free-form Markdown note, exactly one per `(userId, lessonId)`. PUT-upsert semantics; DELETE clears. Lives next to bookmarks in `LearningModule`.
- Goal: a session can `PUT /api/v1/notes` with `{ lessonId, body }` to upsert their note for a lesson; `GET /api/v1/notes/{lessonId}` returns it; `DELETE /api/v1/notes/{lessonId}` clears it. Body is plain Markdown (no rendering server-side); 16 KiB cap.
- Acceptance:
  - OpenAPI under tag `Learning`: `PUT /notes` (200 → `NoteDto`), `GET /notes/{lessonId}` (200 → `NoteDto`, 404 if no note yet), `DELETE /notes/{lessonId}` (204). `bearerAuth`. Spec version 0.10.0 → 0.11.0.
  - Schemas: `NoteDto` (id, lessonId, body, createdAt, updatedAt), `UpsertNoteRequest` ({ lessonId, body } — body trimmed, max 16384 chars).
  - Codegen: TS + Dart in their own commit.
  - Domain: `apps/backend/src/modules/learning/domain/note/{note.ts, note.repository.ts, note.errors.ts}`.
    - `Note.create({ id, userId, lessonId, body })` — invariants: body trimmed, after trim length 1..16384; throws `NoteInvalidError extends InvariantViolation`.
    - `setBody(body)` — same invariants.
    - `NoteNotFoundError extends NotFound`. No ownership-mismatch error (per-user, per-lesson uniqueness already gates by query).
  - Persistence: Prisma `Note` `(id, userId, lessonId, body Text, createdAt, updatedAt)` with composite unique `(userId, lessonId)`. Manual migration SQL.
  - Application:
    - `UpsertNoteCommand` (`{ lessonId, body, actor }`) + handler — verify lesson + grant; load existing via `findByUserAndLesson`; if absent, `Note.create`; else `setBody`; persist via upsert. Returns DTO.
    - `GetNoteQuery` (`{ lessonId, actor }`) + handler — verify grant first (no oracle); load; missing → `NoteNotFoundError`.
    - `DeleteNoteCommand` (`{ lessonId, actor }`) + handler — verify grant; delete by `(userId, lessonId)`; idempotent (no-op when absent — no error to clients).
  - Presentation: `NotesController` separate file, registered in `LearningModule`. Routes `PUT /notes`, `GET /notes/:lessonId`, `DELETE /notes/:lessonId`.
  - Tests: `note.spec.ts` (invariants on create + setBody); 3 handler specs; `prisma-note.repository.spec.ts` (roundtrip with mocked Prisma + composite unique).
  - Quality gates: backend lint + typecheck + test all clean.
- Spec diff: yes — three new paths + two new schemas.
- Codegen impact: yes — TS + Dart.
- Design impact: none.
- Sub-steps:
  - [x] T-024-A: spec edit (spec-writer)
  - [x] T-024-B: codegen (codegen-runner)
  - [x] T-024-C: Prisma `Note` + manual migration SQL
  - [x] T-024-D: domain — `Note` aggregate + repo port + errors
  - [x] T-024-E: persistence — Prisma adapter + mapper
  - [x] T-024-F: application — upsert / get / delete handlers
  - [x] T-024-G: presentation — `NotesController` registered in `LearningModule`
  - [x] T-024-H: tests
  - [x] T-024-I: lint, typecheck, test, prettier; flip card; archive T-024
- Status: done
- Blockers: —

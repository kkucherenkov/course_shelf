# Active tasks

## T-2026-08-31-001 — #317: a course's second save cascade-deletes its lessons

- Created: 2026-08-31
- Owner: claude (backend)
- Spec: GitHub #317
- Goal: a library scan must leave `lesson` rows behind. Today it leaves zero,
  with no `scan_error` and a `succeeded` status.
- Root cause (traced, not guessed):
  1. `schema.prisma:330` — `Lesson.section` is `onDelete: Cascade`.
  2. `prisma-course.repository.ts:168` — every `save()` does an unscoped
     `tx.section.deleteMany({ where: { courseId } })` and recreates.
  3. `run-scan.handler.ts` — `courseRepo.save` (615) -> `lessonRepo.save` (708)
     -> `courseRepo.save` again (773, metadata linking).
     The second save wipes the sections, the cascade takes every lesson with them,
     and the sections come back — so courses and sections look fine and the
     lessons are gone. Not a Prisma/adapter defect: the course and lesson
     repositories use an identical `$transaction` shape and courses persist.
- Spec diff: none
- Codegen impact: no
- Sub-steps:
  - [x] `PrismaCourseRepository.save`: delete only sections that disappeared,
        upsert the rest, so the write is idempotent for lessons
  - [x] Regression spec pinning the SQL shape (no unscoped section delete) —
        verified to fail against the pre-fix repository and pass after
  - [ ] Verify against a real database — NOT DONE. No docker CLI on this
        machine (colima's VM is up, the client is absent), so the cascade
        itself is established from `schema.prisma:330` and the call order,
        not observed. The reporter's own repro in #317 is the confirmation
        step: register a library over a folder of `.mp4`s, scan, and expect
        `SELECT count(*) FROM lesson` to be non-zero.
- Notes:
  - Fixed in the repository rather than by reordering the scan's two saves:
    the second save is the caller that happened to trigger it, but any future
    `courseRepo.save()` after lessons exist would do the same.
  - Adjacent, not fixed here: a P2002 from the section `(courseId, position)`
    unique constraint is translated to `CourseSlugAlreadyTakenError`
    (`prisma-course.repository.ts:217`), which `run-scan.handler.ts` swallows
    as an idempotent skip. Filed as #326.
- Blockers: —

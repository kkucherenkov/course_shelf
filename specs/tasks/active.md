# Active tasks

## T-2026-09-14-force-resync — scoped rescan must actually re-import the course

- Created: 2026-09-14
- Owner: claude (backend-engineer)
- Card: [docs/roadmap/tasks/E32-F01-S03.md](../../docs/roadmap/tasks/E32-F01-S03.md)
- Goal: `POST /api/v1/courses/{id}/rescan` re-derives sections, lesson
  positions and lesson rows from disk for the scoped course, instead of
  hitting the v1 "slug already known → skip" guard 146 lines before the only
  `lessonRepo.save`. A library-wide scan keeps the skip.
- Spec diff: openapi.yaml — `runCourseRescan` description only (no shape change)
- Codegen impact: description text only; regenerate and land whatever moves
- Invariants to preserve:
  - user-edited course metadata (title/slug/poster/level/language/rating/
    instructors/studios/tags) is never re-derived — scope is the force signal,
    the metadata-link block stays off on that path
  - lesson identity: reconcile by `videoPath`, reuse the existing lesson id
    (`LessonProgress` / `Bookmark` / `Note` / `Transcript` reference `lessonId`
    with no FK, so a new id orphans them silently)
  - section identity: reuse the existing section id when the title matches —
    `Lesson.section` is `onDelete: Cascade`, dropping a section drops its
    lessons (#317)
  - generated transcripts survive a resync of their lesson
- Sub-steps:
  - [ ] openapi.yaml description + `spec:validate` / `spec:bundle` / `spec:codegen`
  - [ ] `Course.replaceSections()` — re-derive the section list, reuse ids by title
  - [ ] `LessonRepository.parkPositionsForResync()` + `removeMany()` (port,
        Prisma adapter, adapter specs)
  - [ ] force path in `run-scan.handler.ts` (bypass the slug skip only for the
        scoped course; reuse ids; delete vanished lessons + their learning rows)
  - [ ] unit tests: file count == lesson count, positions 1..n, id survives,
        renamed title survives, vanished lesson + dependants removed, other
        course untouched, full scan still skips
  - [ ] card E32-F01-S03 + TODO.md + GitHub issue
- Status: in-progress
- Blockers: —

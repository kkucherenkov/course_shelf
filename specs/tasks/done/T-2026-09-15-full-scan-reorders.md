## T-2026-09-15-full-scan-reorders — full scan reconciles an already-imported folder instead of skipping it

- Created: 2026-09-15
- Completed: 2026-09-15
- Owner: claude
- Spec: none — internal scan logic only, no wire contract change
- Goal: Closes #544 — a library-wide scan skips a folder it already owns
  (`importedFolderNames.has(folderName)` → `continue` in
  `run-scan.handler.ts`), so it can never repair lesson order once the
  filename parser gains a rule an older import predates. Only the scoped
  `POST /courses/{id}/rescan` recomputes positions today.
- Measured (not deduced) against `ORDER-LESSONS.tsv`/`ORDER-AUDIT.txt`, the
  real prod dump run through the real `parseLessonFileName` +
  `assignLessonPositions`: 153 lessons across 6 courses sit at the wrong
  position; the parser is correct on today's filenames, the data predates it.
- Design: reconcile, not skip and not force-resync. Library-wide scan on an
  already-imported folder now recomputes lesson positions and reuses lesson
  ids (guarded by `lesson.courseId === course.id` — the library-wide
  `existingLessonByVideoPath` index spans every course, so this is what stops
  an id being adopted across a course boundary). Course-level metadata,
  sections, and vanished-lesson cleanup stay exactly as narrow as the old
  skip — those remain force-resync-only (`scopeCourse`), so this stays a
  position/id fix and not a second force-resync path.
- Sub-steps:
  - [x] issue #544
  - [x] `run-scan.handler.ts`: reconcile path for an already-imported folder
        on a library-wide scan
  - [x] unit tests: id-reuse-within-course guard fails without the check
        (verified by temporarily reverting it locally — failed as expected,
        restored); real 18-lesson course from `ORDER-LESSONS.tsv` (measured
        against ALL 6 flagged courses too — reproduced 153/6/62 exactly via a
        throwaway script over the real parser, not copied from the issue)
  - [x] rewrote the one test that encoded the old skip behaviour
        (`E32-F01-S03`'s "a library-wide scan still skips a course it already
        imported") and two others whose fixtures had no `Section` row (a
        shape the reconcile path now legitimately needs — production always
        has one, `COURSE_WITH_SECTIONS_SELECT`)
  - [x] doc comments in `run-scan.handler.ts` (module header + persist block)
  - [x] `docs/user-guide.md`: 3 stale claims fixed ("library scan cannot
        repair a course", "renumbering only happens on a course rescan")
  - [x] lint/format/typecheck/test gates (2110 backend tests green)
  - [x] open PR with `Closes #544` —
        [#545](https://github.com/kkucherenkov/course_shelf/pull/545)
- Status: done — CI green
- Result: [#545](https://github.com/kkucherenkov/course_shelf/pull/545)

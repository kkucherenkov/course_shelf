## T-2026-09-13-e32-lesson-position — lesson position must be unique within its section

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/463
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S01.md](../../docs/roadmap/tasks/E32-F01-S01.md) — `tuxedo` 116, 118
- Goal: stop the scanner from silently dropping lessons whose computed
  position collides; fold in tuxedo 118 (Int32 size overflow leaving scans
  stuck at `status=running` forever) since both share `run-scan.handler.ts`.
- Result summary: `assignLessonPositions()` ranks lessons within a section by
  a sort key (parsed ordinal, composed with `sectionOrdinal` for composite
  `N.M` filenames), emitting the 1-based rank as the position — collisions
  are now structurally impossible. `DiscoveredFile.size` / `Lesson.sizeBytes`
  widened to `BigInt`. Crash path records the cause as a `ScanError` instead
  of leaving the scan stuck `running` with no trace.

## T-2026-09-13-e32-course-rescan — rescan a single course

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/465 (stacks on https://github.com/kkucherenkov/course_shelf/pull/463)
- Owner: claude
- Spec: [docs/roadmap/tasks/E32-F01-S02.md](../../docs/roadmap/tasks/E32-F01-S02.md)
- Goal: `POST /api/v1/courses/{id}/rescan` — re-import one course without a full
  library walk; orphan cleanup scoped so it never touches other courses.
- Result summary: `RunScanCommand` carries an optional `scope: { courseId }`;
  the handler resolves the course's folder from one of its existing lessons'
  `videoPath` and filters the walk's grouping to it. The trap's fix:
  `existingLessonByVideoPath` (what orphan cleanup reads) is built from only
  the scoped course's own lessons when scoped, instead of every course in the
  library — which scopes both sidecar-refresh and cleanup for free. `Scan`
  gains `scopeCourseId`/`scopeCourseName`, carried on the DTO and all three
  realtime lifecycle events. Admin-only rescan button on the course page.

## T-2026-09-14-course-transcription — transcribe one course, not only the whole library

- Created: 2026-09-14
- Completed: 2026-09-14
- Result: https://github.com/kkucherenkov/course_shelf/pull/475
- Owner: claude (backend-engineer)
- Spec: `packages/specs/openapi/openapi.yaml` → new
  `POST /api/v1/courses/{id}/transcription`, `TranscriptionDto.scopeCourseId` /
  `.scopeCourseName`, `StartTranscriptionRequest.language`
- Goal: a library-wide transcription is forty-nine days of CPU on the
  maintainer's hardware (measured: 19.5 min/lesson, 3672 lessons to do). Scope a
  run to one course so an overnight job is possible, mirroring the scoped rescan
  shape #465/#468 established.
- Sub-steps:
  - [x] spec: new path item + DTO scope fields + optional `language`
  - [x] prisma: `scopeCourseId` / `scopeCourseName` on `transcription`
  - [x] domain: `Transcription.start({ scope })`, actionable
        `TranscriptionAlreadyRunningError`
  - [x] handler: resolve course -> library, load only that course's lessons,
        carry the scope on all three lifecycle events
  - [x] per-request `language` threaded through the whisper port
  - [x] `POST /courses/:id/transcription` on `CoursesController`
  - [x] unit tests: scope isolation, skip rule inside scope, scope on events,
        already-running guard
  - [x] web: admin Transcribe button beside Rescan, en + ru keys
- Decision: the library-wide already-running guard STAYS for scoped runs —
  whisper saturates the CPU, so a second run halves the first. The 409 now names
  the running run's id and the cancel route instead of being a bare conflict.
- Status: done
- Blockers: —
- Card: `docs/roadmap/tasks/E32-F02-S01.md` · issue #474

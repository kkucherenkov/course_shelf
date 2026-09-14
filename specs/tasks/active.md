# Active tasks

## T-2026-09-14-course-transcription — transcribe one course, not only the whole library

- Created: 2026-09-14
- Owner: claude (backend-engineer)
- Spec: `packages/specs/openapi/openapi.yaml` → new
  `POST /api/v1/courses/{id}/transcription`, `TranscriptionDto.scopeCourseId` /
  `.scopeCourseName`, `StartTranscriptionRequest.language`
- Goal: a library-wide transcription is forty-nine days of CPU on the
  maintainer's hardware (measured: 19.5 min/lesson, 3672 lessons to do). Scope a
  run to one course so an overnight job is possible, mirroring the scoped rescan
  shape #465/#468 established.
- Sub-steps:
  - [ ] spec: new path item + DTO scope fields + optional `language`
  - [ ] prisma: `scopeCourseId` / `scopeCourseName` on `transcription`
  - [ ] domain: `Transcription.start({ scope })`, actionable
        `TranscriptionAlreadyRunningError`
  - [ ] handler: resolve course -> library, load only that course's lessons,
        carry the scope on all three lifecycle events
  - [ ] per-request `language` threaded through the whisper port
  - [ ] `POST /courses/:id/transcription` on `CoursesController`
  - [ ] unit tests: scope isolation, skip rule inside scope, scope on events,
        already-running guard
  - [ ] web: admin Transcribe button beside Rescan, en + ru keys
- Decision: the library-wide already-running guard STAYS for scoped runs —
  whisper saturates the CPU, so a second run halves the first. The 409 now names
  the running run's id and the cancel route instead of being a bare conflict.
- Status: in-progress
- Blockers: —

## T-2026-09-14-fix-centrifugo-namespaces — declare the namespaces the contract uses

- Created: 2026-09-14
- Owner: claude
- Spec: none — the AsyncAPI contract was already correct; found while
  debugging a live NAS deployment whose scan progress never moved
- Goal: every Centrifugo namespace used by a channel in
  `packages/specs/asyncapi/centrifugo.yaml` must be declared in every
  Centrifugo configuration, and stay that way.
- Sub-steps:
  - [x] add `scans` and `maintenance` to dev, prod and release configs
  - [x] `scripts/check-realtime-namespaces.ts` deriving the required set from
        the contract
  - [x] wire it as `pnpm check:realtime` and a CI step
- Status: in-progress
- Blockers: —

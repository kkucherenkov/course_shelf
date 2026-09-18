## T-2026-09-14-transcription-state-ui — fix transcription realtime state

- Created: 2026-09-14
- Owner: claude
- Spec: `packages/specs/asyncapi/centrifugo.yaml` — `scans:user:{userId}`
  now documents `transcription-started` / `-progress` / `-finished`
- Goal: a running transcription no longer renders as a finished scan, the
  contract documents every kind the backend actually publishes on
  `scans:user:{userId}`, and the transcription panel survives a failed
  initial fetch without a page reload.
- Issues: #508, #516, #511 (`tuxedo` 135, 148, 134)
- Sub-steps:
  - [x] document `transcription-*` events + `scopeCourseId`/`scopeCourseName`
        in `centrifugo.yaml`; `spec:validate && spec:bundle && spec:codegen`
  - [x] `scanLifecycle` store ignores kinds it does not own (runtime guard,
        not compile-time narrowing); audit other channel subscribers
  - [x] `useTranscriptionProgress` polls every 2s while running and retries
        on a failed fetch, mirroring `useLatestScan`
  - [x] tests for both fixes; gates
  - [x] PR
- Status: done
- Completed: 2026-09-14
- Result: https://github.com/kkucherenkov/course_shelf/pull/521

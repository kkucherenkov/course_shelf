# Active tasks

## T-2026-08-30-012 — run whisper transcription over a library

- Created: 2026-08-30
- Owner: claude
- Spec: [docs/roadmap/tasks/E25-F03-S02.md](../../docs/roadmap/tasks/E25-F03-S02.md) (GH #218, #300)
- Goal: an admin can start, watch and stop a transcription pass over a library, and
  the pass survives a restart because re-running skips what is already on disk.
- Acceptance:
  - `POST /api/v1/libraries/{id}/transcriptions` answers 202 with a `running` run and
    the walk continues after the response flushes
  - a run refuses to start when no whisper model is configured, and when one is
    already running for the library
  - a lesson with a sidecar subtitle or an up-to-date generated transcript is skipped
  - a lesson whose audio extraction or whisper call fails is recorded and the run
    carries on
  - `POST /api/v1/transcriptions/{id}/cancel` stops the walk after the lesson in flight
  - `GET /libraries/{id}/transcriptions` and `.../latest` return the history
- Spec diff: none — the contract landed in E25-F03-S01
- Codegen impact: no
- Design impact: none
- Tests: unit — `run-transcription.handler.spec.ts` (mixed skip/transcribe/fail
  counters, cancellation, unconfigured engine, second concurrent run, temp-file
  cleanup on both paths) and `extractCues` cases in the subtitle-converter spec
- Sub-steps:
  - [ ] `extractCues` beside `convertSrtToVtt` + tests
  - [ ] `TranscriptionRepository` / `TranscriptRepository` ports + Prisma adapters
  - [ ] `RunTranscriptionHandler` + spec
  - [ ] Cancel command, latest/list queries
  - [ ] Controllers and DTO
  - [ ] Module wiring, including `WHISPER_ADAPTER`
- Status: in-progress
- Blockers: —

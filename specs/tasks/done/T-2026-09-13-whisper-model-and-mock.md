## T-2026-09-13-whisper-model-and-mock — whisper model in dev, mock adapter in CI

- Created: 2026-09-13
- Owner: claude
- Spec: —
- Goal: `docker compose up` can transcribe without a hand-rolled curl, and
  `POST /libraries/{id}/transcriptions` stops being a permanent 503 in CI
  without shipping a 75 MB ggml file into the CI stack.
- Acceptance:
  - `pnpm whisper:model [size]` downloads `ggml-<size>.bin` into
    `$WHISPER_MODEL_DIR`, idempotently.
  - `AppConfig.transcription.configured` requires the model file to exist on
    disk, not just a non-empty path; mock mode is configured with no path.
  - CI's transcription endpoint answers 202 via `MockWhisperAdapter`, not 503.
- Spec diff: none (no OpenAPI shape change — same 202/503 responses, just a
  different condition for which one fires).
- Codegen impact: no
- Design impact: none
- Tests: unit (`app-config.transcription.spec.ts`,
  `mock-whisper.adapter.spec.ts`), existing backend suite green (175
  files / 1822 tests).
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/444

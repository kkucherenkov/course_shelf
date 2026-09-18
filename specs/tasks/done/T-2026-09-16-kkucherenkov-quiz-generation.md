## T-2026-09-16-kkucherenkov-quiz-generation — quizzes generated from a transcript

- Created: 2026-09-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F02-S01.md](../../docs/roadmap/tasks/E29-F02-S01.md). Issue #235, umbrella #250.
- Goal: on-demand quiz generation from a lesson's transcript cues, via a local
  llama.cpp model chosen at request time, reviewed as a proposal
  (propose/apply/discard, `Quiz` aggregate in `modules/learning`) before it
  becomes real. No auto-trigger on scan/import; no data leaves the machine.

  Design settled across 9 maintainer clarifications (full trace in the PR
  body):
  1. Local model behind a port, alongside whisper — one adapter, no hosted
     fallback, no configurability between the two.
  2. Two trigger routes only — `POST /lessons/{id}/quizzes`,
     `POST /courses/{id}/quizzes` (mirrors `POST /courses/{id}/transcription`,
     E32-F02-S01). No library-wide route.
  3. llama.cpp spawned per call (no resident model, no server), same ggml
     build flags as whisper. Multiple `.gguf` weights coexist in `/models`
     (the existing `WHISPER_MODEL_DIR` bind, reused — not a new volume); the
     admin weight-inventory endpoint (list+delete, covers both engines) also
     serves as the model picker's data source.
  4. Model is chosen per request (`modelId` in the trigger body, optional,
     defaults from config); recorded on each generated `Quiz` row — no
     separate "run" aggregate needed, the Quiz proposal IS the run record.
  5. `/models` mount loses `:ro` — justified in the PR body (re-fetchable
     weights, admin-guarded + path-contained delete, no worse than the
     already-writable DERIVED_PATH). No CI/image involvement: mock adapter
     only, `.dockerignore`/`.gitignore` keep weights out of both.
  6. Lesson transcripts are windowed (char budget, not the whole transcript)
     before any prompt — bounds KV-cache and gives each question its window's
     start timestamp for free.
  7. A per-window cleanup pass (same model) fixes ASR typos before
     generation; ephemeral (never written back to `TranscriptCue`), with a
     hard invariant — cue count/boundaries unchanged or the run falls back to
     the original window text. Optional per-request flag, default on.
  8. Real hardware findings folded in: the actual binary is `llama-completion`
     (`llama-cli` was renamed/broken upstream mid-refactor), it takes its
     prompt via a temp file (`-f`, not `-p`) and echoes it on stdout, and
     Qwen3.5 needs an empty `<think>\n\n</think>\n\n` primed into the prompt
     or it burns its whole token budget reasoning and never answers.
  9. Weights: no CI download, no live-model test, ever (mock adapter only,
     mirroring whisper); the build stage proves AVX2 landed in the binary via
     `objdump` rather than trusting the flags, after a real build without
     them measured 0.91 tok/s vs. the expected order of magnitude more.

  Both routes are async (202) given the real cost: up to ~2x llama-completion
  invocations per window (cleanup + generate) per lesson. No persisted run
  row — an in-memory per-course lock guards concurrent course-scoped runs
  (single-process deployment, no DB row needed). `docs/architecture.md` +
  [ADR-0011](../../docs/adr/0011-local-llm-quiz-generation.md) record the
  local-only + on-demand + async-no-run-row decisions.

  Two real defects surfaced by CI after the design was otherwise settled,
  both fixed before merge: a CodeQL insecure-temp-file finding (`writeFile`
  into a computed `os.tmpdir()` path — switched to `mkdtemp`, which creates
  the directory atomically and exclusively) and a Dockerfile build failure
  (`common/arg.cpp` needs `<linux/limits.h>`, which musl's `build-base` does
  not ship — added the `linux-headers` apk package). Both verified locally
  before the fix-up push: the adapter fix by its own unit test, the
  Dockerfile fix by an actual `docker build --target llama` (89s, binary
  runs, 17k+ `ymm` instructions in the disassembly).

- Spec diff: openapi.yaml — `POST /lessons/{id}/quizzes`,
  `POST /courses/{id}/quizzes`, `GET/POST .../quizzes/{id}/apply|discard`,
  `GET /admin/model-weights`, `DELETE /admin/model-weights/{filename}`
- Codegen impact: yes
- Sub-steps:
  - [x] Prisma schema + migration for `Quiz` (verified against real Postgres)
  - [x] `Quiz` aggregate, errors, repository port (mirrors `IdentifyTask`)
  - [x] `quiz-window.ts` + `quiz-cleanup.ts` pure functions, unit tests incl. the count/boundary invariant
  - [x] `LlamaAdapter` port + `LocalLlamaAdapter` (execFile) + `MockLlamaAdapter`
  - [x] `GenerateQuizCommand`/Handler (lesson XOR course scope, async, in-memory course lock)
  - [x] Apply/Discard/List/Get for `Quiz` (mirrors identify-task queries/commands)
  - [x] Admin model-weights list/delete (`modules/admin`), path-containment-checked, refuses deleting an active default
  - [x] Dockerfile: llama.cpp build stage (same ggml flags as stage W) + objdump AVX2 proof
  - [x] compose.yml / compose.prod.yml / compose.release.yml: drop `:ro` on `/models`, justified inline
  - [x] `.dockerignore`: exclude `/models`
  - [x] `docs/architecture.md` + ADR-0011
  - [x] `docs/deployment.md`: model table (4B default / 9B option, Q4 floor), cleanup-flag note, honest timing caveat
  - [x] OpenAPI + codegen (own commit)
  - [x] `turbo run lint test typecheck` green (backend: 217/217 files, 2267/2268 tests; unrelated pre-existing web/ui failures untouched)
  - [x] Card + TODO.md row + counter + ROADMAP.md regen
  - [x] PR opened, CI green (11/11 checks)
- Status: done
- Blockers: —
- Completed: 2026-09-17
- Result: [PR #692](https://github.com/kkucherenkov/course_shelf/pull/692) — open, CLEAN/MERGEABLE, all checks green; awaiting review/merge

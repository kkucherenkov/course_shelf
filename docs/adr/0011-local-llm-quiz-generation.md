# 0011 — Local llama.cpp for quiz generation; on-demand, nothing leaves the machine

- **Status:** accepted
- **Date:** 2026-09-16
- **Deciders:** @kkucherenkov
- **Tags:** backend, privacy, ml

> Implemented in [E29-F02-S01](../roadmap/tasks/E29-F02-S01.md).

## Context

A self-hosted personal instance's course library and its transcripts are the
owner's own data. Generating a quiz from a lesson needs a text-generation
model; the roadmap card was explicit that Stage B (this card) is deliberately
last in its feature precisely because "a self-hosted personal instance
sending its course audio or transcripts to a third party is a decision the
owner makes, not one the roadmap makes for them." Whisper already answered the
equivalent question for transcription (E25/E27/E30-series work): a local
model, spawned as its own process per call, weights on a bind-mounted volume,
never baked into the image.

## Decision

**Local only, on-demand only, review before real.**

- **Engine:** llama.cpp's `llama-completion` binary, built in the backend
  image from a pinned tag exactly like whisper.cpp's stage (same `GGML_*`
  build flags — see `apps/backend/Dockerfile` stage L). Spawned as a fresh
  process per call via `child_process.execFile` (`LocalLlamaAdapter`), same
  shape as `LocalWhisperAdapter`: no resident model, no server, the weight
  file only lives in RAM for the duration of one invocation. No hosted-API
  adapter exists and none is planned — one adapter, one port
  (`LlamaAdapter`), one mock for tests.
- **Trigger:** two admin-only routes, `POST /lessons/{id}/quizzes` and
  `POST /courses/{id}/quizzes` — mirroring `POST /libraries/{id}/
  transcriptions` / `POST /courses/{id}/transcription`'s granularity, minus
  the library-wide form. Nothing runs on scan or import.
- **Weights:** whisper's ggml `.bin` and llama's `.gguf` share one volume
  (`$WHISPER_MODEL_DIR` → `/models`), fetched by the maintainer, never by a
  script or a CI job. The model actually used is chosen **per request**
  (`GenerateQuizRequest.modelId`, defaulting to `LLAMA_DEFAULT_MODEL`) rather
  than fixed at deploy time like whisper's — several weights (e.g. a 4B and a
  9B quant) can coexist so an admin can compare their output on the same
  lesson. `GET /admin/model-weights` (list, both engines) and `DELETE
  /admin/model-weights/{filename}` are the admin surface for that volume,
  which is why it is mounted read-write now instead of whisper's original
  read-only.
- **Review:** a generated quiz is a `Quiz` proposal
  (`modules/learning/domain/quiz`) with the exact propose → applied |
  discarded lifecycle catalog's `IdentifyTask` already established — reused
  as a state machine, not copied wholesale (`Quiz` has no separate
  "downstream write" step on apply, because unlike a scraped metadata
  fragment there is no pre-existing "real quiz" concept to merge into; the
  proposal row itself becomes the real artifact).
- **Context and quality:** a lesson's cues are windowed into bounded chunks
  before any prompt (`quiz-window.ts`) rather than fed whole — this bounds
  KV-cache and gives each generated question its window's start timestamp by
  construction, satisfying the card's "each question carries the timestamp
  it came from" without asking the model to report one it could hallucinate.
  An ephemeral ASR-cleanup pass (same model, same window) fixes obvious
  whisper transcription typos before generation; it is never written back to
  `TranscriptCue` and falls back to the untouched original text whenever the
  model's reply does not line up 1:1 with the input, because the transcript
  also backs player subtitles, search, and `?t=` deep links.
- **No run-tracking aggregate:** both trigger routes execute
  asynchronously (fire-and-forget, mirroring `RunTranscriptionHandler`'s
  shape) because a course-scoped walk is several llama-completion
  invocations per lesson, but no separate persisted "run" row exists — the
  `Quiz` proposals a walk produces, each stamped with `modelFilename`, are
  themselves the visible record of what ran and with which model.
  Concurrency for the same course is guarded by an in-memory lock
  (`QuizGenerationLockService`), correct for this deployment's single-process
  topology, not a DB-backed one.

## Consequences

### Positive

- Consistent privacy story across every ML-adjacent feature in this repo:
  transcription and quiz generation both stay entirely on the host.
- Reuses two already-proven shapes (whisper's process-per-call adapter,
  identify's propose/apply/discard) instead of inventing a third pattern.
- Comparing two models' output on the same lesson is free — it falls out of
  "model chosen per request" plus "no dedup on proposals," not extra code.

### Negative

- Local inference on NAS-class CPUs is slow and memory-bandwidth bound —
  measured at 0.91 tok/s on a 16-thread AVX-512 machine when the ggml SIMD
  build flags are missing, and meaningfully slower than desktop-DDR5 tok/s
  figures even with them present. `docs/deployment.md` tells operators to
  benchmark on one lesson before a whole course.
- No crash recovery for a course-scoped walk (no persisted run row) — a
  killed process silently leaves the remaining lessons ungenerated. Accepted
  as a v1 gap; the upgrade path is a Transcription-shaped run row if this
  proves painful in practice.
- The `/models` volume moved from read-only to read-write to allow the admin
  delete endpoint to work. A compromised backend process can now remove
  weight files — mitigated by the same admin guard, path-containment check,
  and "not the active model" guard the endpoint itself enforces, and judged
  acceptable because the same compromise already has read/write on Postgres
  and on `DERIVED_PATH`.

### Neutral

- Fixed 4-option multiple choice, one question per transcript window — a
  deliberate simplification, not a platform limitation; a richer question
  shape is a schema change to `GenerateQuizRequest`/`QuizQuestionDto`; not to
  the port or the aggregate.

## Alternatives considered

### Option A — hosted API (OpenAI/Anthropic/etc.)

Rejected outright, not just for v1. The roadmap card's own framing — a
self-hosted instance choosing to send course content off-host is the owner's
call, never the default — rules this out as anything but an opt-in the owner
never gets asked for here. No adapter for it exists, and none is planned;
adding one "for flexibility" was explicitly rejected during design.

### Option B — a resident model server (ollama, llama.cpp `server`, vLLM)

Rejected for this deployment class. A long-running service holding a
2.6-9 GB model in RAM competes with everything else running on a personal
NAS between generation requests, for a feature that runs rarely and
on-demand. Process-per-call costs a model load every invocation but returns
all of that RAM the instant it is not generating anything — the same
trade-off whisper already made, extended here for consistency and because
nothing about quiz generation's usage pattern argues for the opposite choice.

### Option C — one fixed model per deployment, chosen at config time

Rejected. Whisper's own `WHISPER_MODEL_PATH` (one file, set once) was the
starting template, but the maintainer wanted the ability to compare a 4B
against a 9B run of the same lesson without redeploying — the model became a
per-request choice instead, with the weights directory itself (not one
env var) as the source of truth for what is available.

## Related

- [ADR-0003](0003-cqrs-without-event-sourcing.md) — the CQRS shape `Quiz`'s
  commands/queries follow.
- `apps/backend/src/modules/catalog/domain/identify/` — the propose/apply/
  discard precedent this reuses.
- `apps/backend/src/modules/catalog/domain/transcription/` — the
  process-per-call adapter precedent this reuses.

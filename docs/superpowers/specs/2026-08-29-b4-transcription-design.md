# B4 — Whisper transcription — design

- Date: 2026-08-29
- Status: approved for planning
- Scope: stage B4 of the v2 programme, promoted ahead of B3 and B1
- Parent spec: [`2026-08-29-transcript-first-design.md`](./2026-08-29-transcript-first-design.md)

## 1. Why this moved to the front

The parent spec deferred B4 behind a measurement: what share of lessons have no
subtitle track? The maintainer answered it from the real library — most courses
have none. That inverts the order. A transcript panel (B3) and a transcript
search (B2) both render data that, for this library, does not exist yet.
Transcription is what creates it, so it goes first.

## 2. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| E1 | Generated transcripts are files on a **separate writable volume**, not rows in Postgres and not files beside the video | `COURSES_PATH` is mounted `:ro` in both `docker/compose.prod.yml:116` and `docker/compose.release.yml:117`. Files stay portable and hand-editable; the volume also gives the thumbnail writer somewhere legal to go (see E5). |
| E2 | **whisper.cpp**, shelled out via `execFile`, binary and model paths from `AppConfig` | Exactly the pattern `local-ffmpeg.adapter.ts` already uses for `ffmpeg`/`ffprobe`. No Python runtime, no network, no API key, no third party receiving the audio. |
| E3 | Transcription is modelled as **a scan**: a run over a library that skips what is already done | The maintainer's call, and the better one. `Scan` already provides the shape — status lifecycle, counters, per-item error records, throttled Centrifugo progress — and the skip rule makes a restart cheap without a durable queue. |
| E4 | Skip state lives in a `Transcript` row carrying the **source video's `(mtime, size)`** | Existence answers "already done"; the signature answers "still current". A re-encoded video is re-transcribed; an untouched one is not. |
| E5 | The derived volume also becomes the home for scan thumbnails | Otherwise the repository grows a writable artifact location and leaves the one existing writable-artifact bug (tuxedo 35) sitting next to it. Half-applying the fix is worse than either alternative. |
| E6 | B4 writes cues into `TranscriptCue` as it goes | It has the parsed text in hand. Not writing them means re-reading every generated file later. This shrinks B1 to "parse the pre-existing sidecars + build the index". |

## 3. Consequence for the parent spec

B4 now creates the `Transcript` and `TranscriptCue` tables that B1 was going to
introduce, with two added columns (`origin`, `derivedPath`). **B1 shrinks** to:
parse pre-existing `.srt`/`.vtt` sidecars into cues, add the `pg_trgm` index, and
extend the search port. The parent spec's D4 row and §8 are amended accordingly.

## 4. Storage layout

A new bind mount, writable, present in `compose.yml`, `compose.prod.yml` and
`compose.release.yml`:

```yaml
- "${DERIVED_PATH:-./derived}:/data/derived"
```

Artifacts mirror the library-relative path under a per-library directory, so the
tree stays navigable by hand and two libraries cannot collide:

```
/data/derived/<libraryId>/<library-relative video path>.<lang>.srt
```

`AppConfig` gains `derivedPath` (env `DERIVED_PATH`, default `/data/derived`),
following the `ffprobePath` / `ffmpegPath` accessor style.

**Traversal.** `lesson-file-locator.ts` currently resolves subtitles as
`path.resolve(library.rootPath, subtitle.path)` behind a traversal guard. A
generated transcript resolves against `path.resolve(derivedPath, libraryId, …)`
instead, with its own guard. The guard is duplicated rather than loosened — one
resolver that accepts two roots is one resolver that can be talked into the wrong
one.

## 5. Schema

```prisma
enum TranscriptOrigin {
  sidecar    // discovered .srt/.vtt next to the video
  generated  // produced by whisper
}

model Transcript {
  id          String           @id @default(cuid())
  lessonId    String
  language    String
  origin      TranscriptOrigin
  /** Video path for `generated`; sidecar path for `sidecar`. Library-relative. */
  sourcePath  String
  sourceMtime DateTime
  sourceSize  Int
  /** Only for `generated`: path under DERIVED_PATH/<libraryId>/. */
  derivedPath String?
  createdAt   DateTime         @default(now())
  cues        TranscriptCue[]

  @@unique([lessonId, language], name: "uq_transcript_lesson_language")
  @@map("transcript")
}

model TranscriptCue {
  id           String     @id @default(cuid())
  transcriptId String
  startMs      Int
  endMs        Int
  text         String
  transcript   Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)

  @@index([transcriptId, startMs])
  @@map("transcript_cue")
}

enum TranscriptionStatus {
  running
  succeeded
  failed
  cancelled
}

model Transcription {
  id                 String                  @id @default(cuid())
  libraryId          String
  status             TranscriptionStatus
  force              Boolean                 @default(false)
  startedAt          DateTime                @default(now())
  finishedAt         DateTime?
  lessonsTotal       Int                     @default(0)
  lessonsSkipped     Int                     @default(0)
  lessonsTranscribed Int                     @default(0)
  lessonsFailed      Int                     @default(0)
  errors             TranscriptionErrorRecord[]

  @@index([libraryId, status])
  @@index([libraryId, startedAt])
  @@map("transcription")
}

model TranscriptionErrorRecord {
  id              String        @id @default(cuid())
  transcriptionId String
  transcription   Transcription @relation(fields: [transcriptionId], references: [id], onDelete: Cascade)
  lessonId        String
  message         String
  code            String?

  @@map("transcription_error")
}
```

`Transcription` is `Scan` with the counters that matter here. `TranscriptionErrorRecord`
mirrors `ScanErrorRecord` so one failed video costs its own lesson, never the run.

**`Transcript` deliberately has no foreign key to `Lesson` or `Subtitle`.**
`prisma-lesson.repository.ts:123-127` saves a lesson by deleting and recreating
all its subtitle rows; anything cascading from those would be erased by the next
ordinary scan. Cleanup is therefore explicit: a scan that no longer finds a
lesson deletes its transcripts, and the generated file is removed with the row.

## 6. The run

`RunTranscriptionCommand(libraryId, force, actorUserId)`, handled in the catalog
module beside `run-scan.handler.ts` and following its structure: persist the
aggregate as `running`, return `202 Accepted`, then do the work outside the
request.

For each lesson in the library, in outline order:

1. **Skip when a sidecar exists.** A hand-made or shipped subtitle always wins;
   we do not spend hours improving on it.
2. **Skip when a generated transcript is current** — a `Transcript` row with
   `origin = generated` whose `sourceMtime`/`sourceSize` match the video on disk.
   `force = true` skips this check and re-transcribes.
3. Extract audio: `ffmpeg -i <video> -vn -ac 1 -ar 16000 -c:a pcm_s16le <tmp>.wav`
   into the container's temp directory, never into a mounted volume.
4. Transcribe: `<WHISPER_PATH> -m <WHISPER_MODEL_PATH> -l auto -osrt -of <out>`.
5. Move the `.srt` to its derived path, parse it into cues with the same
   `extractCues` helper B1 defines, and write the `Transcript` + `TranscriptCue`
   rows in one transaction.
6. Delete the temporary audio whether or not the step succeeded.
7. Publish progress to Centrifugo, one message per finished lesson.

Failure at any step records a `TranscriptionErrorRecord` and moves to the next
lesson.

**Restart.** There is no durable queue and none is needed: re-running the
transcription skips everything already on disk, so a restart costs at most the
lesson that was in flight.

**Cancellation.** Long runs must be stoppable. The handler checks for a
`cancelled` status between lessons — cooperative, so the in-flight `whisper`
child is allowed to finish rather than leaving a truncated file.

**Concurrency.** One lesson at a time by default, `TRANSCRIPTION_CONCURRENCY`
(default `1`) and `WHISPER_THREADS` in `AppConfig`. This runs on a NAS; the
default must not saturate the box that is also serving video.

**Timeouts.** `local-ffmpeg.adapter.ts` uses a 30-second `execFile` timeout,
which is correct for `ffprobe` and wrong by three orders of magnitude for
transcription. The whisper adapter takes its own `WHISPER_TIMEOUT_MS`, defaulting
to six hours, and the audio-extraction call gets a separate, larger-than-30s
timeout of its own.

## 7. Contract

Mirrors the existing scan routes (`/api/v1/admin/scans`,
`/api/v1/libraries/{id}/scans`, `/api/v1/libraries/{id}/scans/latest`):

| Route | Purpose |
| --- | --- |
| `POST /api/v1/libraries/{id}/transcriptions` | Start a run. Body `{ force?: boolean }`. `202` with the aggregate. |
| `GET /api/v1/libraries/{id}/transcriptions` | History for a library. |
| `GET /api/v1/libraries/{id}/transcriptions/latest` | Current or last run — what the admin screen polls. |
| `POST /api/v1/transcriptions/{id}/cancel` | Request cancellation. |
| `GET /api/v1/admin/transcriptions` | Cross-library list, mirroring `/admin/scans`. |

`LessonDto.subtitles[]` gains an optional `generated?: boolean` so a player can
label a machine-made track honestly. Additive, so no client breaks.

`GET /api/v1/stream/lessons/{id}/subtitles/{language}` learns one new branch: when
no sidecar `Subtitle` matches the language, look for a generated `Transcript` and
serve its derived file. The existing `.srt → WebVTT` conversion is reused
unchanged; only the root the path resolves against differs.

Spec-first order as always: edit `packages/specs/openapi/openapi.yaml`, then
`pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`, land the generated
artefacts in their own commit, then implement.

## 8. Packaging

The backend image gains the `whisper.cpp` binary. The model file is **not**
baked in — a `ggml-base` is ~150 MB and `ggml-medium` ~1.5 GB, which does not
belong in an image pushed to a registry on every release. It is a mounted file,
path from `WHISPER_MODEL_PATH`, with the download documented in
`docs/deployment.md` and `docs/deploy-ugreen-nas-dockge.md`.

If the binary or the model is missing, the start endpoint fails fast with a clear
RFC 9457 problem rather than beginning a run that cannot produce anything.

## 9. Admin UI

A Transcription card on the existing admin library screen, modelled on the scan
card: last run, counters, a Start button with a "re-transcribe everything"
checkbox for `force`, a cancel button while running, live progress over the
Centrifugo channel the scan card already knows how to subscribe to, and the error
list.

## 10. Testing

| Unit | Test |
| --- | --- |
| Skip rule | Pure function over `(lesson, subtitles, transcript, videoStat, force)`; table-driven — sidecar present, generated current, generated stale, forced, nothing. |
| Whisper adapter | Fake `execFile`, as `local-ffmpeg.adapter.spec.ts` does: non-zero exit and timeout each raise their own domain error. |
| Run handler | A library of three lessons where one has a sidecar, one is current, one is new → counters `skipped: 2, transcribed: 1`; a failing lesson records an error and the run still succeeds; a cancellation between lessons ends the run `cancelled`. |
| Derived path | Traversal attempt via a crafted `videoPath` is rejected. |
| Subtitle route | Generated transcript is served when no sidecar matches; sidecar still wins when both exist. |

No test invokes a real `whisper` binary. CI does not transcribe.

## 11. Out of scope

- Editing a generated transcript in the UI. The file is on disk and editable;
  a UI for it is a separate ask.
- Translation between languages. Whisper's translate mode is not wired.
- GPU acceleration and multi-machine distribution.
- Speaker diarisation.

## 12. Risks

1. **Throughput on a NAS.** A large library may take days. This was accepted
   explicitly. The run is resumable and cancellable, which is what makes it
   acceptable; the admin card must show honest progress rather than a spinner.
2. **Model quality by language.** `-l auto` on a small model misidentifies short
   or accented audio. The detected language is stored per transcript, so a wrong
   one is visible and re-runnable per lesson rather than poisoning the library.
3. **Disk growth.** SRT is small, but a large library times several languages is
   not nothing. The derived volume needs a size figure in the deployment docs.

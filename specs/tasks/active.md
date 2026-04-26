# Active tasks

## T-2026-04-26-026 — ffprobe + thumbnail extraction (E06-F02-S02)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E06-F02-S02.md` — Catalog F02 second slice. The scanner today only counts files; it does not extract duration / resolution / codec. This story adds an `FfmpegAdapter` port + a `LocalFfmpegAdapter` (shells out to `ffprobe`/`ffmpeg`), wires the calls into the scan walk, and writes a 320×180 JPEG poster per lesson.
- Goal: each `Lesson` row carries a real `duration` (already a column from E06-F03-S02; currently always null). `LessonDto.durationSeconds` finally has a value. A thumbnail file lives next to the cache at a deterministic path so the player can paint a poster without re-extracting on every page load. A single failing file does **not** abort the scan — the failure is recorded as a `ScanError` and the walk continues.
- Acceptance:
  - New domain port `FfmpegAdapter` (Symbol token) at `apps/backend/src/modules/catalog/domain/scan/ffmpeg-adapter.ts`:
    ```ts
    export interface VideoMetadata {
      durationSeconds: number;
      widthPx: number;
      heightPx: number;
      codec: string;
    }
    export interface ThumbnailRequest {
      videoAbsolutePath: string;
      outAbsolutePath: string;
      atSecond: number; // typically duration / 4
      widthPx: 320;
      heightPx: 180;
      jpegQuality: number; // 0..100, ≈ 30
    }
    export interface FfmpegAdapter {
      probe(absolutePath: string): Promise<VideoMetadata>;
      writeThumbnail(req: ThumbnailRequest): Promise<void>;
    }
    ```
  - `LocalFfmpegAdapter` impl shells out to `ffprobe -v quiet -print_format json -show_format -show_streams "${path}"` and parses the JSON. Thumbnails via `ffmpeg -ss <atSecond> -i "${src}" -frames:v 1 -vf scale=320:180 -q:v <jpegQuality> -y "${out}"`. Use `child_process.execFile` with explicit args (no shell) and strict timeouts (probe 30s, thumbnail 30s); reject on non-zero exit. **Do not** add `fluent-ffmpeg` (the card mentions it but a thin `execFile` wrapper avoids the dep + types fight); document the deviation in the commit message.
  - Configurable: `AppConfig.ffprobePath` (default `'ffprobe'`), `AppConfig.ffmpegPath` (default `'ffmpeg'`), `AppConfig.thumbnailJpegQuality` (default `30`).
  - Thumbnail naming: `<videoSourceWithoutExt>.thumb.jpg` next to the source. Idempotent: skip generation if the thumbnail mtime is newer than the video mtime. Same `.cache.` ignore pattern as subtitles — `stem-match.ts` already classifies arbitrary `*.thumb.jpg` as `image` material; **add** a rule that strips `*.thumb.jpg` from being detected as a Material (otherwise a generated thumb round-trips into `Lesson.materials`). Treat as `kind: 'ignored'` (the kind added in T-025).
  - Scan handler integration: after the scan walk discovers a `ScannedLesson`, the handler calls `ffmpeg.probe(videoAbsolutePath)` and `ffmpeg.writeThumbnail(...)` per file. **Failure on a single file does not abort the scan**: wrap each call in try/catch; on failure record a `ScanError` with code `ffmpeg-probe-failed` or `ffmpeg-thumbnail-failed`, continue with the next lesson. Probe success populates a new `metadata` field on `ScannedLesson` (`{ durationSeconds, widthPx, heightPx, codec }`).
  - **Lesson rows**: this story does **not** insert Lesson rows from the scan (still deferred to a future "scan-materialise" story). It populates `Scan.discoveredLessons[].metadata` and writes thumbnails to disk. The `LessonDto.durationSeconds` only fills in once the materialise story lands; for now this story is verifiable through a unit test that asserts `discoveredLessons[0].metadata.durationSeconds` is correct on a fixture.
  - Fixture: a tiny open-licence MP4 must live somewhere. **Don't** check a binary into git. Generate one in the test setup:
    ```
    ffmpeg -f lavfi -i color=c=blue:s=320x180:d=2 -c:v libx264 -t 2 -y <tmpfs>/fixture.mp4
    ```
    The integration test skips if `ffmpeg` is not installed (`which ffmpeg` returns non-zero); the unit test against pre-recorded ffprobe JSON always runs.
  - Tests:
    - `local-ffmpeg-adapter.spec.ts` — unit: feeds a pre-recorded ffprobe JSON string to the parser; covers `bit_rate`, codec, width/height extraction; rejects malformed JSON. Mocks `execFile`.
    - `local-ffmpeg-adapter.integration.spec.ts` — runs against a generated fixture; **skipped** when no ffmpeg in PATH (`vi.skip` based on `which ffmpeg`).
    - `run-scan.handler.spec.ts` extension: a fixture with two videos where `ffmpeg.probe(secondVideo)` rejects; assert the scan completes with status `succeeded`, `discoveredLessons[0].metadata` populated, `discoveredLessons[1].metadata === undefined`, one `ffmpeg-probe-failed` ScanError.
    - `stem-match.spec.ts` regression — `*.thumb.jpg` is classified as `ignored`, not material.
  - Documentation: extend `docs/troubleshooting.md` with a section listing `ffmpeg`/`ffprobe` as a runtime prerequisite for full scan output (parallel to the Java entry from T-012). Local dev: `brew install ffmpeg`. CI: `actions/setup-ffmpeg` or `apt install ffmpeg`.
  - Quality gates: backend lint + typecheck + test all clean.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: see Acceptance.
- Sub-steps:
  - [x] T-026-A: `FfmpegAdapter` port + `LocalFfmpegAdapter` impl
  - [x] T-026-B: AppConfig fields (`ffprobePath`, `ffmpegPath`, `thumbnailJpegQuality`)
  - [x] T-026-C: thumbnail-write idempotency + `.thumb.jpg` ignored in stem-match
  - [x] T-026-D: scan handler integration (per-lesson try/catch; ScanError on failure)
  - [x] T-026-E: unit + integration tests
  - [x] T-026-F: docs/troubleshooting.md ffmpeg prerequisite entry
  - [x] T-026-G: lint, typecheck, test, prettier; flip card; archive T-026
- Status: done

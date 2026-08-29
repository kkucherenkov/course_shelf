# B4 — Whisper Transcription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give CourseShelf the ability to transcribe a library's videos with whisper.cpp, as a resumable run that skips what is already done, and to serve the results as ordinary subtitle tracks.

**Architecture:** A `Transcription` aggregate shaped like the existing `Scan`: persisted `running`, `202 Accepted`, work continues outside the request, progress over Centrifugo, per-lesson errors recorded without failing the run. Generated `.srt` files land on a new writable `/data/derived` volume because `COURSES_PATH` is mounted `:ro`. A `Transcript` row per `(lesson, language)` carries the source video's `(mtime, size)` — its existence is the skip marker, its signature the freshness check.

**Tech Stack:** NestJS 11, CQRS, Prisma 7, Postgres 18, whisper.cpp and ffmpeg via `child_process.execFile`, Centrifugo v6, Nuxt 4 for the admin card, Vitest.

**Spec:** [`docs/superpowers/specs/2026-08-29-b4-transcription-design.md`](../specs/2026-08-29-b4-transcription-design.md)

## Global Constraints

- **Spec-first is non-negotiable.** No HTTP route exists before `packages/specs/openapi/openapi.yaml` describes it. After editing: `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`, and the generated artefacts land in **their own commit**.
- Never edit `packages/api-client-ts/src/generated/` or `packages/api-client-dart/lib/generated/` by hand.
- Never read `process.env` directly — every value comes through `AppConfig`.
- Never use `any` to escape a type error.
- Every user-visible string goes through `t()`, in both `apps/web/i18n/locales/en.ts` and `ru.ts`. `pnpm check:i18n` enforces parity.
- Domain and application layers throw domain errors, never NestJS HTTP exceptions — `boundaries/element-types` enforces this at lint time.
- No `!important`, no inline `style=""`, no hard-coded hex brand colours in the admin card.
- Conventional Commits. Never commit to `main`; land through a PR.
- Node `>=24`, pnpm `>=10`. If `turbo` is "not found", the Node version is wrong — fix that.
- After editing `.ts`/`.vue`/`.scss`/`.json`/`.md`: `pnpm --filter <pkg> lint --fix`, then `pnpm stylelint:fix`, then `pnpm format`.
- **No test may invoke a real `whisper` or `ffmpeg` binary.** Both are faked at the `execFile` boundary, as `local-ffmpeg.adapter.spec.ts` already does.

## Before you start

Push this to the top of `specs/tasks/active.md`:

```md
## T-2026-08-29-008 — B4 whisper transcription

- Created: 2026-08-29
- Owner: claude
- Spec: [docs/superpowers/specs/2026-08-29-b4-transcription-design.md](../../docs/superpowers/specs/2026-08-29-b4-transcription-design.md)
- Goal: transcribe a library with whisper.cpp as a resumable, skipping run; serve results as subtitle tracks.
- Spec diff: openapi.yaml — 5 transcription routes, SubtitleDto.generated
- Codegen impact: yes
- Sub-steps:
  - [ ] config + derived volume
  - [ ] derived path resolver
  - [ ] ffmpeg audio extraction
  - [ ] whisper adapter
  - [ ] schema + migration
  - [ ] Transcription aggregate
  - [ ] skip rule
  - [ ] OpenAPI + codegen
  - [ ] run handler + controller + wiring
  - [ ] subtitle route serves generated tracks
  - [ ] scan: thumbnails to derived volume + orphan cleanup
  - [ ] admin card
  - [ ] docs
- Status: in-progress
- Blockers: —
```

## File Structure

| File | Responsibility |
| --- | --- |
| `apps/backend/src/common/config/app-config.ts` (modify) | `derivedPath` + `transcription` accessors. |
| `docker/compose.yml`, `compose.prod.yml`, `compose.release.yml` (modify) | The `/data/derived` writable mount. |
| `apps/backend/src/modules/catalog/domain/transcription/derived-path.ts` (create) | Pure path resolution + traversal guard. |
| `apps/backend/src/modules/catalog/domain/transcription/transcription.ts` (create) | The run aggregate. |
| `apps/backend/src/modules/catalog/domain/transcription/transcription.errors.ts` (create) | Domain errors. |
| `apps/backend/src/modules/catalog/domain/transcription/transcription.repository.ts` (create) | Port + token. |
| `apps/backend/src/modules/catalog/domain/transcription/whisper.port.ts` (create) | Port + token for the transcriber. |
| `apps/backend/src/modules/catalog/domain/transcription/skip-rule.ts` (create) | Pure decision: skip or transcribe. |
| `apps/backend/src/modules/catalog/infra/local-whisper.adapter.ts` (create) | `execFile` shell-out to whisper.cpp. |
| `apps/backend/src/modules/catalog/infra/prisma-transcription.repository.ts` (create) | Persistence. |
| `apps/backend/src/modules/catalog/infra/prisma-transcript.repository.ts` (create) | `Transcript` + `TranscriptCue` persistence. |
| `apps/backend/src/modules/catalog/domain/scan/ffmpeg-adapter.ts` (modify) | `extractAudio` on the existing port. |
| `apps/backend/src/modules/catalog/infra/local-ffmpeg.adapter.ts` (modify) | Its implementation. |
| `apps/backend/src/modules/catalog/application/commands/run-transcription.{command,handler}.ts` (create) | The run. |
| `apps/backend/src/modules/catalog/application/commands/cancel-transcription.{command,handler}.ts` (create) | Cooperative cancel. |
| `apps/backend/src/modules/catalog/application/queries/get-latest-transcription.{query,handler}.ts`, `list-transcriptions.*` (create) | Reads. |
| `apps/backend/src/modules/catalog/transcriptions.controller.ts`, `transcriptions.dto.ts` (create) | HTTP. |
| `apps/backend/prisma/schema.prisma` + migration (modify/create) | Four models, two enums. |
| `packages/specs/openapi/openapi.yaml` (modify) | Routes and schemas. |
| `apps/backend/src/modules/streaming/domain/lesson-file-locator.ts` (modify) | Resolve generated transcripts against the derived root. |
| `apps/web/app/components/admin/AdminTranscriptionCard.vue` (create) | Admin UI. |

---

### Task 1: Config and the derived volume

**Files:**
- Modify: `apps/backend/src/common/config/app-config.ts`
- Test: `apps/backend/src/common/config/app-config.spec.ts`
- Modify: `docker/compose.yml`, `docker/compose.prod.yml`, `docker/compose.release.yml`, `.env.example`

**Interfaces:**
- Produces:
  ```ts
  export interface TranscriptionConfig {
    readonly whisperPath: string;
    readonly modelPath: string;
    readonly timeoutMs: number;
    readonly threads: number;
    readonly language: string;
    /** False when no model path is set — the run endpoint fails fast on this. */
    readonly configured: boolean;
  }
  ```
  plus `AppConfig.derivedPath: string` and `AppConfig.transcription: TranscriptionConfig`.

- [ ] **Step 1: Write the failing test**

Append to `apps/backend/src/common/config/app-config.spec.ts`, following the fake-ConfigService pattern already in that file:

```ts
describe('derivedPath', () => {
  it('defaults to /data/derived', () => {
    const cfg = makeConfig({});
    expect(cfg.derivedPath).toBe('/data/derived');
  });

  it('honours DERIVED_PATH', () => {
    const cfg = makeConfig({ DERIVED_PATH: '/mnt/derived' });
    expect(cfg.derivedPath).toBe('/mnt/derived');
  });
});

describe('transcription', () => {
  it('defaults to whisper-cli, six hours, four threads, auto language', () => {
    const cfg = makeConfig({});
    expect(cfg.transcription).toEqual({
      whisperPath: 'whisper-cli',
      modelPath: '',
      timeoutMs: 21_600_000,
      threads: 4,
      language: 'auto',
      configured: false,
    });
  });

  it('is configured once a model path is present', () => {
    const cfg = makeConfig({ WHISPER_MODEL_PATH: '/models/ggml-base.bin' });
    expect(cfg.transcription.configured).toBe(true);
    expect(cfg.transcription.modelPath).toBe('/models/ggml-base.bin');
  });

  it('reads the overrides', () => {
    const cfg = makeConfig({
      WHISPER_PATH: '/opt/whisper/main',
      WHISPER_MODEL_PATH: '/models/ggml-medium.bin',
      WHISPER_TIMEOUT_MS: '3600000',
      WHISPER_THREADS: '2',
      WHISPER_LANGUAGE: 'ru',
    });
    expect(cfg.transcription).toEqual({
      whisperPath: '/opt/whisper/main',
      modelPath: '/models/ggml-medium.bin',
      timeoutMs: 3_600_000,
      threads: 2,
      language: 'ru',
      configured: true,
    });
  });
});
```

If `makeConfig` is not the helper name in that spec, use whatever it already defines — do not add a second helper.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test src/common/config/app-config.spec.ts`
Expected: FAIL — `cfg.derivedPath` is not a function/property.

- [ ] **Step 3: Write minimal implementation**

Add to `apps/backend/src/common/config/app-config.ts`, next to `ffmpegPath`:

```ts
  /**
   * Root for artefacts CourseShelf generates from the media it reads:
   * whisper transcripts and scan thumbnails. Separate from COURSES_PATH
   * because that mount is read-only in production.
   * Default: '/data/derived'. Env: DERIVED_PATH.
   */
  get derivedPath(): string {
    return this.stringOrDefault('DERIVED_PATH', '/data/derived');
  }

  /**
   * whisper.cpp settings. `configured` is false until a model file is named —
   * the binary alone cannot transcribe anything, and starting a run that can
   * only fail is worse than refusing it.
   * Env: WHISPER_PATH, WHISPER_MODEL_PATH, WHISPER_TIMEOUT_MS,
   *      WHISPER_THREADS, WHISPER_LANGUAGE.
   */
  get transcription(): TranscriptionConfig {
    const modelPath = this.stringOrDefault('WHISPER_MODEL_PATH', '');
    return {
      whisperPath: this.stringOrDefault('WHISPER_PATH', 'whisper-cli'),
      modelPath,
      // Six hours. A long lesson on NAS-grade CPU is measured in hours, not
      // in the 30s that is right for ffprobe.
      timeoutMs: this.numberOrDefault('WHISPER_TIMEOUT_MS', 21_600_000),
      threads: this.numberOrDefault('WHISPER_THREADS', 4),
      language: this.stringOrDefault('WHISPER_LANGUAGE', 'auto'),
      configured: modelPath !== '',
    };
  }
```

Declare `TranscriptionConfig` beside the other config interfaces in the same file.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test src/common/config/app-config.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add the volume to all three composes**

In `docker/compose.yml` (dev), on the `backend` service, add to `volumes:` and `environment:`:

```yaml
      - "${DERIVED_PATH:-../derived}:/data/derived"
```
```yaml
      DERIVED_PATH: /data/derived
      WHISPER_MODEL_PATH: "${WHISPER_MODEL_PATH:-}"
```

In `docker/compose.prod.yml` and `docker/compose.release.yml`, on the `backend` service, beneath the existing `COURSES_PATH` line (`compose.release.yml:117`):

```yaml
      - "${DERIVED_PATH:?DERIVED_PATH is required (writable host directory for generated transcripts and thumbnails)}:/data/derived"
      - "${WHISPER_MODEL_PATH:?WHISPER_MODEL_PATH is required (path to a ggml model file)}:/models/whisper.bin:ro"
```

and to `environment:`:

```yaml
      DERIVED_PATH: /data/derived
      WHISPER_MODEL_PATH: /models/whisper.bin
      WHISPER_THREADS: "${WHISPER_THREADS:-4}"
      WHISPER_LANGUAGE: "${WHISPER_LANGUAGE:-auto}"
```

Note the deliberate asymmetry: `COURSES_PATH` stays `:ro`, the derived mount is writable, and the model is mounted read-only.

Add the same four variables to `.env.example` with comments.

- [ ] **Step 6: Put the whisper binary in the backend image**

Find the backend Dockerfile (`apps/backend/Dockerfile` or under `docker/`) and
install `whisper.cpp` in the runtime stage, beside wherever `ffmpeg` is already
installed. Build it from source pinned to a tag, or install a distribution
package if the base image offers one; either way pin the version explicitly.

Install the **binary only**. The model is a mounted file (Task 1 Step 5) —
`ggml-medium` is ~1.5 GB and does not belong in an image pushed to a registry
on every release.

Verify the image can see both binaries:

```bash
docker compose -f docker/compose.yml build backend
docker compose -f docker/compose.yml run --rm backend sh -lc 'ffmpeg -version | head -1 && whisper-cli --help | head -1'
```

Expected: both print. If the binary installs under a different name, set
`WHISPER_PATH` to it in the compose environment rather than renaming it.

- [ ] **Step 7: Format, lint, commit**

```bash
pnpm --filter @app/backend lint --fix
pnpm format
git add apps/backend/src/common/config/ apps/backend/Dockerfile docker/ .env.example
git commit -m "feat(backend): add derived-artifact path and whisper config

COURSES_PATH is mounted read-only in prod, so anything CourseShelf generates
from the media it reads needs somewhere else to live."
```

---

### Task 2: Derived path resolution

**Files:**
- Create: `apps/backend/src/modules/catalog/domain/transcription/derived-path.ts`
- Create: `apps/backend/src/modules/catalog/domain/transcription/transcription.errors.ts`
- Test: `apps/backend/src/modules/catalog/domain/transcription/derived-path.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export function derivedTranscriptPath(input: {
    derivedRoot: string;
    libraryId: string;
    /** Library-relative video path, exactly as stored on Lesson.videoPath. */
    videoPath: string;
    language: string;
  }): string;

  export class DerivedPathEscapedError extends DomainError {}
  ```

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/modules/catalog/domain/transcription/derived-path.spec.ts`:

```ts
/**
 * Spec for derivedTranscriptPath.
 */

import { describe, it, expect } from 'vitest';
import { derivedTranscriptPath } from './derived-path';
import { DerivedPathEscapedError } from './transcription.errors';

const base = {
  derivedRoot: '/data/derived',
  libraryId: 'lib-1',
  language: 'en',
};

describe('derivedTranscriptPath', () => {
  it('mirrors the library-relative path under the library id', () => {
    expect(
      derivedTranscriptPath({ ...base, videoPath: 'Course/01 - Intro.mp4' }),
    ).toBe('/data/derived/lib-1/Course/01 - Intro.mp4.en.srt');
  });

  it('handles a video at the library root', () => {
    expect(derivedTranscriptPath({ ...base, videoPath: 'Intro.mp4' })).toBe(
      '/data/derived/lib-1/Intro.mp4.en.srt',
    );
  });

  it('keeps languages apart', () => {
    const en = derivedTranscriptPath({ ...base, videoPath: 'a.mp4' });
    const ru = derivedTranscriptPath({ ...base, videoPath: 'a.mp4', language: 'ru' });
    expect(en).not.toBe(ru);
  });

  it('rejects a traversal attempt in the video path', () => {
    expect(() =>
      derivedTranscriptPath({ ...base, videoPath: '../../etc/passwd.mp4' }),
    ).toThrow(DerivedPathEscapedError);
  });

  it('rejects an absolute video path', () => {
    expect(() => derivedTranscriptPath({ ...base, videoPath: '/etc/passwd.mp4' })).toThrow(
      DerivedPathEscapedError,
    );
  });

  it('rejects a traversal attempt in the language', () => {
    expect(() =>
      derivedTranscriptPath({ ...base, videoPath: 'a.mp4', language: '../x' }),
    ).toThrow(DerivedPathEscapedError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test src/modules/catalog/domain/transcription/derived-path.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `transcription.errors.ts`, matching the `DomainError` base the other `*.errors.ts` files in this module extend (check `scan.errors.ts` for the exact import and constructor shape and follow it):

```ts
/**
 * WHY this file exists:
 * Domain errors for the transcription bounded context. Mirrors scan.errors.ts.
 */
import { DomainError } from '../../../../shared/domain-error';

/** A derived path resolved outside the derived root — fail closed. */
export class DerivedPathEscapedError extends DomainError {
  constructor(attempted: string) {
    super(`Derived path escapes the derived root: ${attempted}`);
  }
}

/** Whisper is not usable — no model configured. */
export class TranscriptionNotConfiguredError extends DomainError {
  constructor() {
    super('Transcription is not configured: WHISPER_MODEL_PATH is unset');
  }
}

/** A transcription is already running for this library. */
export class TranscriptionAlreadyRunningError extends DomainError {
  constructor(libraryId: string) {
    super(`A transcription is already running for library ${libraryId}`);
  }
}

/** Mutating a transcription that has already finished. */
export class TranscriptionInTerminalStateError extends DomainError {
  constructor(status: string) {
    super(`Transcription is in terminal state: ${status}`);
  }
}

/** The whisper child process failed or timed out. */
export class WhisperFailedError extends DomainError {
  constructor(audioPath: string, reason: string) {
    super(`Whisper failed for ${audioPath}: ${reason}`);
  }
}

/** ffmpeg could not produce the audio track. */
export class AudioExtractionFailedError extends DomainError {
  constructor(videoPath: string, reason: string) {
    super(`Audio extraction failed for ${videoPath}: ${reason}`);
  }
}
```

Create `derived-path.ts`:

```ts
/**
 * WHY this file exists:
 * The single place that knows how a lesson's library-relative video path maps
 * to the path of its generated transcript under DERIVED_PATH, and the single
 * place that enforces the traversal-protection invariant for that root.
 *
 * The guard is deliberately a second, separate implementation from the one in
 * lesson-file-locator.ts rather than a shared resolver taking two roots: one
 * resolver that accepts either root is one resolver that can be talked into
 * the wrong one.
 */
import path from 'node:path';

import { DerivedPathEscapedError } from './transcription.errors';

export interface DerivedTranscriptPathInput {
  readonly derivedRoot: string;
  readonly libraryId: string;
  /** Library-relative video path, exactly as stored on Lesson.videoPath. */
  readonly videoPath: string;
  readonly language: string;
}

/** Language tags are short ASCII; anything else is a path-injection attempt. */
const SAFE_LANGUAGE_RE = /^[A-Za-z0-9_-]{1,16}$/;

export function derivedTranscriptPath(input: DerivedTranscriptPathInput): string {
  const { derivedRoot, libraryId, videoPath, language } = input;

  if (!SAFE_LANGUAGE_RE.test(language)) {
    throw new DerivedPathEscapedError(`language: ${language}`);
  }

  const libraryRoot = path.resolve(derivedRoot, libraryId);
  const resolved = path.resolve(libraryRoot, `${videoPath}.${language}.srt`);

  const relative = path.relative(libraryRoot, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new DerivedPathEscapedError(resolved);
  }

  return resolved;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test src/modules/catalog/domain/transcription/derived-path.spec.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog/domain/transcription/
git commit -m "feat(backend): resolve derived transcript paths with a traversal guard"
```

---

### Task 3: ffmpeg audio extraction

whisper.cpp wants 16 kHz mono PCM. The existing `FfmpegAdapter` port owns every ffmpeg call, so the new one goes there rather than into the whisper adapter.

**Files:**
- Modify: `apps/backend/src/modules/catalog/domain/scan/ffmpeg-adapter.ts`
- Modify: `apps/backend/src/modules/catalog/infra/local-ffmpeg.adapter.ts`
- Test: `apps/backend/src/modules/catalog/infra/local-ffmpeg.adapter.spec.ts`

**Interfaces:**
- Produces, on the existing `FfmpegAdapter` interface:
  ```ts
  export interface AudioExtractRequest {
    readonly videoAbsolutePath: string;
    readonly outAbsolutePath: string;
    readonly timeoutMs: number;
  }
  extractAudio(req: AudioExtractRequest): Promise<void>;
  ```

- [ ] **Step 1: Write the failing test**

Append to `apps/backend/src/modules/catalog/infra/local-ffmpeg.adapter.spec.ts`, reusing the `execFile` mock that file already installs:

```ts
describe('extractAudio', () => {
  it('asks ffmpeg for 16 kHz mono PCM and no video', async () => {
    mockExecFileSuccess({ stdout: '', stderr: '' });
    const adapter = makeAdapter();

    await adapter.extractAudio({
      videoAbsolutePath: '/data/courses/a.mp4',
      outAbsolutePath: '/tmp/a.wav',
      timeoutMs: 600_000,
    });

    const [bin, args, opts] = lastExecFileCall();
    expect(bin).toBe('ffmpeg');
    expect(args).toEqual([
      '-i',
      '/data/courses/a.mp4',
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'pcm_s16le',
      '-y',
      '/tmp/a.wav',
    ]);
    expect(opts).toEqual({ timeout: 600_000 });
  });

  it('raises AudioExtractionFailedError on a non-zero exit', async () => {
    mockExecFileFailure(new Error('ffmpeg exited 1'));
    const adapter = makeAdapter();

    await expect(
      adapter.extractAudio({
        videoAbsolutePath: '/data/courses/a.mp4',
        outAbsolutePath: '/tmp/a.wav',
        timeoutMs: 600_000,
      }),
    ).rejects.toBeInstanceOf(AudioExtractionFailedError);
  });
});
```

Use whatever helper names that spec already defines for arranging the `execFile` mock; do not introduce parallel helpers.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test src/modules/catalog/infra/local-ffmpeg.adapter.spec.ts`
Expected: FAIL — `extractAudio` is not a function.

- [ ] **Step 3: Write minimal implementation**

Add to the `FfmpegAdapter` interface in `domain/scan/ffmpeg-adapter.ts`:

```ts
/** Request to extract a whisper-ready audio track from a video. */
export interface AudioExtractRequest {
  readonly videoAbsolutePath: string;
  readonly outAbsolutePath: string;
  /** Transcription-sized, not probe-sized — extraction of a long lecture is minutes. */
  readonly timeoutMs: number;
}
```

and the method to the interface:

```ts
  /**
   * Decode the video's audio to 16 kHz mono signed 16-bit PCM, which is what
   * whisper.cpp consumes. Throws AudioExtractionFailedError on failure.
   */
  extractAudio(req: AudioExtractRequest): Promise<void>;
```

Implement in `infra/local-ffmpeg.adapter.ts`, beside `writeThumbnail`:

```ts
  async extractAudio(req: AudioExtractRequest): Promise<void> {
    const { videoAbsolutePath, outAbsolutePath, timeoutMs } = req;

    const args = [
      '-i',
      videoAbsolutePath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'pcm_s16le',
      '-y',
      outAbsolutePath,
    ];

    try {
      await execFileAsync(this.appConfig.ffmpegPath, args, { timeout: timeoutMs });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new AudioExtractionFailedError(videoAbsolutePath, msg);
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test src/modules/catalog/infra/local-ffmpeg.adapter.spec.ts`
Expected: PASS, including the pre-existing probe and thumbnail tests.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog/domain/scan/ffmpeg-adapter.ts \
        apps/backend/src/modules/catalog/infra/local-ffmpeg.adapter.ts \
        apps/backend/src/modules/catalog/infra/local-ffmpeg.adapter.spec.ts
git commit -m "feat(backend): extract 16 kHz mono audio for transcription"
```

---

### Task 4: The whisper adapter

**Files:**
- Create: `apps/backend/src/modules/catalog/domain/transcription/whisper.port.ts`
- Create: `apps/backend/src/modules/catalog/infra/local-whisper.adapter.ts`
- Test: `apps/backend/src/modules/catalog/infra/local-whisper.adapter.spec.ts`

**Interfaces:**
- Consumes: `TranscriptionConfig` from Task 1, `WhisperFailedError` from Task 2.
- Produces:
  ```ts
  export interface TranscribeRequest {
    readonly audioAbsolutePath: string;
    /** Output path WITHOUT the .srt extension — whisper.cpp appends it. */
    readonly outBaseAbsolutePath: string;
  }
  export interface TranscribeResult {
    readonly srtAbsolutePath: string;
  }
  export interface WhisperAdapter {
    transcribe(req: TranscribeRequest): Promise<TranscribeResult>;
  }
  export const WHISPER_ADAPTER: unique symbol;
  ```

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/modules/catalog/infra/local-whisper.adapter.spec.ts`:

```ts
/**
 * Spec for LocalWhisperAdapter. The whisper binary is never executed —
 * execFile is mocked, exactly as in local-ffmpeg.adapter.spec.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile } from 'node:child_process';
import { LocalWhisperAdapter } from './local-whisper.adapter';
import { WhisperFailedError } from '../domain/transcription/transcription.errors';
import type { AppConfig } from '../../../common/config/app-config';

type ExecFileCallback = (err: Error | null, stdout: string, stderr: string) => void;

function makeConfig(overrides: Partial<AppConfig['transcription']> = {}): AppConfig {
  return {
    transcription: {
      whisperPath: 'whisper-cli',
      modelPath: '/models/ggml-base.bin',
      timeoutMs: 21_600_000,
      threads: 4,
      language: 'auto',
      configured: true,
      ...overrides,
    },
  } as unknown as AppConfig;
}

function succeed(): void {
  vi.mocked(execFile).mockImplementation(
    (_bin: string, _args: string[], _opts: unknown, cb: ExecFileCallback) => {
      cb(null, '', '');
      return undefined as never;
    },
  );
}

function failWith(error: Error): void {
  vi.mocked(execFile).mockImplementation(
    (_bin: string, _args: string[], _opts: unknown, cb: ExecFileCallback) => {
      cb(error, '', '');
      return undefined as never;
    },
  );
}

describe('LocalWhisperAdapter', () => {
  beforeEach(() => {
    vi.mocked(execFile).mockReset();
  });

  it('invokes the configured binary with model, threads, language and SRT output', async () => {
    succeed();
    const adapter = new LocalWhisperAdapter(makeConfig());

    const result = await adapter.transcribe({
      audioAbsolutePath: '/tmp/a.wav',
      outBaseAbsolutePath: '/data/derived/lib-1/a.mp4.en',
    });

    expect(result.srtAbsolutePath).toBe('/data/derived/lib-1/a.mp4.en.srt');

    const call = vi.mocked(execFile).mock.calls[0];
    expect(call?.[0]).toBe('whisper-cli');
    expect(call?.[1]).toEqual([
      '-m',
      '/models/ggml-base.bin',
      '-f',
      '/tmp/a.wav',
      '-t',
      '4',
      '-l',
      'auto',
      '-osrt',
      '-of',
      '/data/derived/lib-1/a.mp4.en',
    ]);
    expect(call?.[2]).toEqual({ timeout: 21_600_000 });
  });

  it('passes an explicit language through instead of auto', async () => {
    succeed();
    const adapter = new LocalWhisperAdapter(makeConfig({ language: 'ru' }));

    await adapter.transcribe({
      audioAbsolutePath: '/tmp/a.wav',
      outBaseAbsolutePath: '/out/a',
    });

    expect(vi.mocked(execFile).mock.calls[0]?.[1]).toContain('ru');
  });

  it('raises WhisperFailedError when the process fails', async () => {
    failWith(new Error('killed'));
    const adapter = new LocalWhisperAdapter(makeConfig());

    await expect(
      adapter.transcribe({ audioAbsolutePath: '/tmp/a.wav', outBaseAbsolutePath: '/out/a' }),
    ).rejects.toBeInstanceOf(WhisperFailedError);
  });

  it('raises WhisperFailedError when the timeout elapses', async () => {
    const timeout = new Error('spawn ETIMEDOUT');
    failWith(timeout);
    const adapter = new LocalWhisperAdapter(makeConfig());

    await expect(
      adapter.transcribe({ audioAbsolutePath: '/tmp/a.wav', outBaseAbsolutePath: '/out/a' }),
    ).rejects.toBeInstanceOf(WhisperFailedError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test src/modules/catalog/infra/local-whisper.adapter.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `domain/transcription/whisper.port.ts`:

```ts
/**
 * WHY this file exists:
 * Port for the speech-to-text engine. The application layer never learns that
 * the engine is whisper.cpp, a child process, or local at all — swapping in a
 * hosted transcriber later means one new adapter, not a new call site.
 */

export interface TranscribeRequest {
  readonly audioAbsolutePath: string;
  /** Output path WITHOUT the extension — whisper.cpp appends `.srt` itself. */
  readonly outBaseAbsolutePath: string;
}

export interface TranscribeResult {
  readonly srtAbsolutePath: string;
}

export interface WhisperAdapter {
  /** @throws WhisperFailedError on non-zero exit or timeout. */
  transcribe(req: TranscribeRequest): Promise<TranscribeResult>;
}

export const WHISPER_ADAPTER = Symbol('WHISPER_ADAPTER');
```

Create `infra/local-whisper.adapter.ts`:

```ts
/**
 * WHY this file exists:
 * Concrete WhisperAdapter backed by a child_process.execFile shell-out to
 * whisper.cpp, mirroring LocalFfmpegAdapter — same reasoning: a thin execFile
 * wrapper beats a binding dependency, and the interface surface stays minimal.
 *
 * The timeout is transcription-sized (six hours by default) rather than the
 * 30 seconds that is right for ffprobe: on NAS-grade CPU a long lecture is
 * measured in hours, and killing it at 30s would mean never finishing anything.
 *
 * The binary writes `<outBase>.srt` itself; we return that path rather than
 * parsing stdout, which whisper.cpp uses for progress chatter.
 */
import { execFile } from 'node:child_process';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../../../common/config/app-config';
import { WhisperFailedError } from '../domain/transcription/transcription.errors';

import type {
  TranscribeRequest,
  TranscribeResult,
  WhisperAdapter,
} from '../domain/transcription/whisper.port';

/**
 * Manual promise wrapper around execFile — same reason as LocalFfmpegAdapter:
 * promisify at module level would capture the reference before vi.mock()
 * installs the double.
 */
function execFileAsync(
  cmd: string,
  args: string[],
  opts: { timeout: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (execError, stdout, stderr) => {
      if (execError) {
        reject(new Error(execError.message, { cause: execError }));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

@Injectable()
export class LocalWhisperAdapter implements WhisperAdapter {
  constructor(private readonly appConfig: AppConfig) {}

  async transcribe(req: TranscribeRequest): Promise<TranscribeResult> {
    const cfg = this.appConfig.transcription;
    const { audioAbsolutePath, outBaseAbsolutePath } = req;

    const args = [
      '-m',
      cfg.modelPath,
      '-f',
      audioAbsolutePath,
      '-t',
      String(cfg.threads),
      '-l',
      cfg.language,
      '-osrt',
      '-of',
      outBaseAbsolutePath,
    ];

    try {
      await execFileAsync(cfg.whisperPath, args, { timeout: cfg.timeoutMs });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new WhisperFailedError(audioAbsolutePath, msg);
    }

    return { srtAbsolutePath: `${outBaseAbsolutePath}.srt` };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test src/modules/catalog/infra/local-whisper.adapter.spec.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog/domain/transcription/whisper.port.ts \
        apps/backend/src/modules/catalog/infra/local-whisper.adapter.ts \
        apps/backend/src/modules/catalog/infra/local-whisper.adapter.spec.ts
git commit -m "feat(backend): add a whisper.cpp adapter behind a port"
```

---

### Task 5: Schema and migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20260829120000_add_transcription/migration.sql`

**Interfaces:**
- Produces the `Transcript`, `TranscriptCue`, `Transcription`, `TranscriptionErrorRecord` models and the `TranscriptOrigin`, `TranscriptionStatus` enums, exactly as written in §5 of the spec.

- [ ] **Step 1: Add the models**

Copy the four models and two enums from §5 of the design document into `apps/backend/prisma/schema.prisma`, placed after the `Subtitle` model so related tables stay together.

- [ ] **Step 2: Generate the migration**

```bash
pnpm --filter @app/backend exec prisma migrate dev --name add_transcription
```

- [ ] **Step 3: Verify the generated SQL**

Read the generated `migration.sql`. It must create four tables, two enum types, and the `uq_transcript_lesson_language` unique constraint. It must **not** contain a foreign key from `transcript` to `lesson` or to `subtitle` — `prisma-lesson.repository.ts:123-127` deletes and recreates subtitle rows on every lesson save, so a cascade from either would erase transcripts on the next ordinary scan. If Prisma emitted one because a relation was declared by mistake, remove the relation from the schema and regenerate.

- [ ] **Step 4: Confirm the client type-checks**

Run: `pnpm --filter @app/backend typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma/
git commit -m "feat(backend): add transcript and transcription tables

Transcript intentionally has no FK to lesson or subtitle: subtitle rows are
delete-and-recreated on every lesson save, so a cascade from either would
erase transcripts on the next scan."
```

---

### Task 6: The Transcription aggregate

**Files:**
- Create: `apps/backend/src/modules/catalog/domain/transcription/transcription.ts`
- Test: `apps/backend/src/modules/catalog/domain/transcription/transcription.spec.ts`

**Interfaces:**
- Consumes: `TranscriptionInTerminalStateError` from Task 2.
- Produces:
  ```ts
  export type TranscriptionId = Id<'Transcription'>;
  export type TranscriptionStatusValue = 'running' | 'succeeded' | 'failed' | 'cancelled';
  export interface TranscriptionErrorEntry {
    readonly lessonId: string;
    readonly message: string;
    readonly code?: string;
  }
  export class Transcription {
    static start(props: { id: string; libraryId: string; force: boolean; lessonsTotal: number; now?: Date }): Transcription;
    static reconstitute(props: TranscriptionProps): Transcription;
    get status(): TranscriptionStatusValue;
    get lessonsTotal(): number;
    get lessonsSkipped(): number;
    get lessonsTranscribed(): number;
    get lessonsFailed(): number;
    get errors(): readonly TranscriptionErrorEntry[];
    get finishedAt(): Date | undefined;
    recordSkipped(): void;
    recordTranscribed(): void;
    recordFailure(entry: TranscriptionErrorEntry): void;
    complete(now?: Date): void;
    fail(now?: Date): void;
    cancel(now?: Date): void;
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/modules/catalog/domain/transcription/transcription.spec.ts`:

```ts
/**
 * Spec for the Transcription aggregate.
 */

import { describe, it, expect } from 'vitest';
import { Transcription } from './transcription';
import { TranscriptionInTerminalStateError } from './transcription.errors';

function running(): Transcription {
  return Transcription.start({ id: 't1', libraryId: 'lib-1', force: false, lessonsTotal: 3 });
}

describe('Transcription', () => {
  it('starts running with zeroed counters and the known total', () => {
    const t = running();
    expect(t.status).toBe('running');
    expect(t.lessonsTotal).toBe(3);
    expect(t.lessonsSkipped).toBe(0);
    expect(t.lessonsTranscribed).toBe(0);
    expect(t.lessonsFailed).toBe(0);
    expect(t.finishedAt).toBeUndefined();
  });

  it('counts skips, successes and failures independently', () => {
    const t = running();
    t.recordSkipped();
    t.recordSkipped();
    t.recordTranscribed();
    t.recordFailure({ lessonId: 'l3', message: 'whisper died', code: 'whisper-failed' });

    expect(t.lessonsSkipped).toBe(2);
    expect(t.lessonsTranscribed).toBe(1);
    expect(t.lessonsFailed).toBe(1);
    expect(t.errors).toHaveLength(1);
    expect(t.errors[0]?.lessonId).toBe('l3');
  });

  it('completes with a finishedAt', () => {
    const t = running();
    const now = new Date('2026-08-29T12:00:00Z');
    t.complete(now);
    expect(t.status).toBe('succeeded');
    expect(t.finishedAt).toEqual(now);
  });

  it('cancels with a finishedAt', () => {
    const t = running();
    t.cancel();
    expect(t.status).toBe('cancelled');
    expect(t.finishedAt).toBeDefined();
  });

  it('fails with a finishedAt', () => {
    const t = running();
    t.fail();
    expect(t.status).toBe('failed');
  });

  it('refuses every mutation once terminal', () => {
    for (const close of [
      (t: Transcription) => t.complete(),
      (t: Transcription) => t.fail(),
      (t: Transcription) => t.cancel(),
    ]) {
      const t = running();
      close(t);
      expect(() => t.recordSkipped()).toThrow(TranscriptionInTerminalStateError);
      expect(() => t.recordTranscribed()).toThrow(TranscriptionInTerminalStateError);
      expect(() => t.recordFailure({ lessonId: 'x', message: 'y' })).toThrow(
        TranscriptionInTerminalStateError,
      );
      expect(() => t.complete()).toThrow(TranscriptionInTerminalStateError);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test src/modules/catalog/domain/transcription/transcription.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `transcription.ts`, following `domain/scan/scan.ts` — same branded id, same private-field-plus-getter shape, same `assertRunning` guard:

```ts
/**
 * WHY this file exists:
 * The Transcription aggregate captures the lifecycle and results of one pass
 * over a library's videos. Deliberately shaped like Scan: status transitions,
 * counters, and per-item error records that do not fail the run.
 *
 * The counters differ from Scan's because the interesting question here is not
 * "how many files did we see" but "how many did we skip, finish, and fail" —
 * a resumed run is mostly skips, and that has to be legible in the UI.
 */
import { brand } from '../../../../shared/branded-id';
import { TranscriptionInTerminalStateError } from './transcription.errors';

import type { Id } from '../../../../shared/branded-id';

export type TranscriptionId = Id<'Transcription'>;

export type TranscriptionStatusValue = 'running' | 'succeeded' | 'failed' | 'cancelled';

/** A non-fatal per-lesson failure recorded during the run. */
export interface TranscriptionErrorEntry {
  readonly lessonId: string;
  readonly message: string;
  readonly code?: string;
}

export interface TranscriptionProps {
  readonly id: TranscriptionId;
  readonly libraryId: string;
  readonly status: TranscriptionStatusValue;
  readonly force: boolean;
  readonly startedAt: Date;
  readonly finishedAt: Date | undefined;
  readonly lessonsTotal: number;
  readonly lessonsSkipped: number;
  readonly lessonsTranscribed: number;
  readonly lessonsFailed: number;
  readonly errors: TranscriptionErrorEntry[];
}

const TERMINAL_STATUSES: ReadonlySet<TranscriptionStatusValue> = new Set([
  'succeeded',
  'failed',
  'cancelled',
]);

export class Transcription {
  readonly id: TranscriptionId;
  readonly libraryId: string;
  readonly force: boolean;
  readonly startedAt: Date;
  private _status: TranscriptionStatusValue;
  private _finishedAt: Date | undefined;
  private _lessonsTotal: number;
  private _lessonsSkipped: number;
  private _lessonsTranscribed: number;
  private _lessonsFailed: number;
  private readonly _errors: TranscriptionErrorEntry[];

  private constructor(props: TranscriptionProps) {
    this.id = props.id;
    this.libraryId = props.libraryId;
    this.force = props.force;
    this.startedAt = props.startedAt;
    this._status = props.status;
    this._finishedAt = props.finishedAt;
    this._lessonsTotal = props.lessonsTotal;
    this._lessonsSkipped = props.lessonsSkipped;
    this._lessonsTranscribed = props.lessonsTranscribed;
    this._lessonsFailed = props.lessonsFailed;
    this._errors = [...props.errors];
  }

  get status(): TranscriptionStatusValue {
    return this._status;
  }
  get finishedAt(): Date | undefined {
    return this._finishedAt;
  }
  get lessonsTotal(): number {
    return this._lessonsTotal;
  }
  get lessonsSkipped(): number {
    return this._lessonsSkipped;
  }
  get lessonsTranscribed(): number {
    return this._lessonsTranscribed;
  }
  get lessonsFailed(): number {
    return this._lessonsFailed;
  }
  get errors(): readonly TranscriptionErrorEntry[] {
    return this._errors;
  }

  static start(props: {
    id: string;
    libraryId: string;
    force: boolean;
    lessonsTotal: number;
    now?: Date;
  }): Transcription {
    return new Transcription({
      id: brand<string, 'Transcription'>(props.id),
      libraryId: props.libraryId,
      status: 'running',
      force: props.force,
      startedAt: props.now ?? new Date(),
      finishedAt: undefined,
      lessonsTotal: props.lessonsTotal,
      lessonsSkipped: 0,
      lessonsTranscribed: 0,
      lessonsFailed: 0,
      errors: [],
    });
  }

  /** Reconstitutes from a persisted row. Bypasses invariants — the DB wins. */
  static reconstitute(props: TranscriptionProps): Transcription {
    return new Transcription(props);
  }

  private assertRunning(): void {
    if (TERMINAL_STATUSES.has(this._status)) {
      throw new TranscriptionInTerminalStateError(this._status);
    }
  }

  recordSkipped(): void {
    this.assertRunning();
    this._lessonsSkipped++;
  }

  recordTranscribed(): void {
    this.assertRunning();
    this._lessonsTranscribed++;
  }

  recordFailure(entry: TranscriptionErrorEntry): void {
    this.assertRunning();
    this._lessonsFailed++;
    this._errors.push(entry);
  }

  complete(now?: Date): void {
    this.assertRunning();
    this._status = 'succeeded';
    this._finishedAt = now ?? new Date();
  }

  fail(now?: Date): void {
    this.assertRunning();
    this._status = 'failed';
    this._finishedAt = now ?? new Date();
  }

  cancel(now?: Date): void {
    this.assertRunning();
    this._status = 'cancelled';
    this._finishedAt = now ?? new Date();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test src/modules/catalog/domain/transcription/transcription.spec.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog/domain/transcription/transcription.ts \
        apps/backend/src/modules/catalog/domain/transcription/transcription.spec.ts
git commit -m "feat(backend): add the Transcription aggregate"
```

---

### Task 7: The skip rule

The rule that makes a re-run cheap and a restart survivable. Pure, so it is table-tested.

**Files:**
- Create: `apps/backend/src/modules/catalog/domain/transcription/skip-rule.ts`
- Test: `apps/backend/src/modules/catalog/domain/transcription/skip-rule.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type TranscriptionDecision = 'skip-sidecar' | 'skip-current' | 'transcribe';

  export interface TranscriptionDecisionInput {
    /** True when the lesson already has a hand-made/shipped subtitle track. */
    readonly hasSidecarSubtitle: boolean;
    /** The existing generated transcript for this lesson, if any. */
    readonly existing: { sourceMtime: Date; sourceSize: number } | null;
    /** The video file as it is on disk right now. */
    readonly video: { mtime: Date; size: number };
    readonly force: boolean;
  }

  export function decideTranscription(input: TranscriptionDecisionInput): TranscriptionDecision;
  ```

- [ ] **Step 1: Write the failing test**

Create `apps/backend/src/modules/catalog/domain/transcription/skip-rule.spec.ts`:

```ts
/**
 * Spec for decideTranscription.
 */

import { describe, it, expect } from 'vitest';
import { decideTranscription } from './skip-rule';
import type { TranscriptionDecisionInput } from './skip-rule';

const MTIME = new Date('2026-08-01T00:00:00Z');
const OTHER_MTIME = new Date('2026-08-02T00:00:00Z');

function input(over: Partial<TranscriptionDecisionInput> = {}): TranscriptionDecisionInput {
  return {
    hasSidecarSubtitle: false,
    existing: null,
    video: { mtime: MTIME, size: 1000 },
    force: false,
    ...over;
  };
}

describe('decideTranscription', () => {
  it('skips a lesson that already has a sidecar subtitle', () => {
    expect(decideTranscription(input({ hasSidecarSubtitle: true }))).toBe('skip-sidecar');
  });

  it('skips when the generated transcript matches the video signature', () => {
    expect(
      decideTranscription(input({ existing: { sourceMtime: MTIME, sourceSize: 1000 } })),
    ).toBe('skip-current');
  });

  it('re-transcribes when the video mtime moved', () => {
    expect(
      decideTranscription(input({ existing: { sourceMtime: OTHER_MTIME, sourceSize: 1000 } })),
    ).toBe('transcribe');
  });

  it('re-transcribes when the video size changed', () => {
    expect(
      decideTranscription(input({ existing: { sourceMtime: MTIME, sourceSize: 999 } })),
    ).toBe('transcribe');
  });

  it('transcribes when nothing exists', () => {
    expect(decideTranscription(input())).toBe('transcribe');
  });

  it('force overrides a current generated transcript', () => {
    expect(
      decideTranscription(
        input({ existing: { sourceMtime: MTIME, sourceSize: 1000 }, force: true }),
      ),
    ).toBe('transcribe');
  });

  it('force does NOT override a hand-made sidecar', () => {
    expect(decideTranscription(input({ hasSidecarSubtitle: true, force: true }))).toBe(
      'skip-sidecar',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @app/backend test src/modules/catalog/domain/transcription/skip-rule.spec.ts`
Expected: FAIL — module not found. (It will also flag the `...over;` typo in the helper above — fix it to `...over,` when you paste it.)

- [ ] **Step 3: Write minimal implementation**

Create `skip-rule.ts`:

```ts
/**
 * WHY this file exists:
 * The single rule that decides whether a lesson needs transcribing. It is what
 * makes a re-run cheap and a restart survivable: no durable queue is needed
 * because re-running skips everything already done.
 *
 * A hand-made sidecar always wins, even under `force`. Force is for redoing
 * OUR work — spending six hours to overwrite a human's subtitles with a
 * machine's is never what someone meant by "re-transcribe".
 */

export type TranscriptionDecision = 'skip-sidecar' | 'skip-current' | 'transcribe';

export interface TranscriptionDecisionInput {
  readonly hasSidecarSubtitle: boolean;
  readonly existing: { sourceMtime: Date; sourceSize: number } | null;
  readonly video: { mtime: Date; size: number };
  readonly force: boolean;
}

export function decideTranscription(input: TranscriptionDecisionInput): TranscriptionDecision {
  if (input.hasSidecarSubtitle) return 'skip-sidecar';
  if (input.force) return 'transcribe';
  if (input.existing === null) return 'transcribe';

  const sameMtime = input.existing.sourceMtime.getTime() === input.video.mtime.getTime();
  const sameSize = input.existing.sourceSize === input.video.size;
  return sameMtime && sameSize ? 'skip-current' : 'transcribe';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @app/backend test src/modules/catalog/domain/transcription/skip-rule.spec.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog/domain/transcription/skip-rule.ts \
        apps/backend/src/modules/catalog/domain/transcription/skip-rule.spec.ts
git commit -m "feat(backend): add the transcription skip rule

A hand-made sidecar wins even under force: force is for redoing our own work."
```

---

### Task 8: OpenAPI and codegen

**Spec-first gate.** Nothing in Task 9 may be written before this task is merged — `express-openapi-validator` rejects any route the contract does not describe.

**Files:**
- Modify: `packages/specs/openapi/openapi.yaml`
- Regenerated (own commit): `packages/api-client-ts/src/generated/`, `packages/api-client-dart/lib/generated/`, `packages/specs/src/openapi-types.ts`

- [ ] **Step 1: Add the schemas**

In `components.schemas`, mirroring `ScanDto` and `ScanStatus`:

```yaml
    TranscriptionStatus:
      type: string
      enum: [running, succeeded, failed, cancelled]
      description: Lifecycle state of a transcription run.

    TranscriptionErrorDto:
      type: object
      required: [lessonId, message]
      properties:
        lessonId:
          type: string
          description: Lesson whose transcription failed.
        message:
          type: string
        code:
          type: string
          description: Machine-readable cause, e.g. `whisper-failed`.

    TranscriptionDto:
      type: object
      required:
        [id, libraryId, status, force, startedAt, lessonsTotal, lessonsSkipped,
         lessonsTranscribed, lessonsFailed, errors]
      description: >-
        One pass over a library's videos. Lessons that already have a subtitle
        track, or an up-to-date generated transcript, are skipped — which is why
        a re-run is cheap and a restart costs at most one lesson.
      properties:
        id: { type: string }
        libraryId: { type: string }
        status: { $ref: "#/components/schemas/TranscriptionStatus" }
        force:
          type: boolean
          description: When true, existing generated transcripts were redone.
        startedAt: { type: string, format: date-time }
        finishedAt: { type: string, format: date-time }
        lessonsTotal: { type: integer, minimum: 0 }
        lessonsSkipped: { type: integer, minimum: 0 }
        lessonsTranscribed: { type: integer, minimum: 0 }
        lessonsFailed: { type: integer, minimum: 0 }
        errors:
          type: array
          items: { $ref: "#/components/schemas/TranscriptionErrorDto" }

    StartTranscriptionRequest:
      type: object
      properties:
        force:
          type: boolean
          default: false
          description: >-
            Re-transcribe lessons that already have a generated transcript.
            Hand-made subtitle sidecars are never overwritten.

    TranscriptionListDto:
      type: object
      required: [items]
      properties:
        items:
          type: array
          items: { $ref: "#/components/schemas/TranscriptionDto" }
```

Add to the existing `SubtitleDto`:

```yaml
        generated:
          type: boolean
          description: >-
            True when this track was produced by transcription rather than
            discovered as a sidecar. Optional — absent means sidecar.
```

Give `StartTranscriptionRequest` an explicit `required: []`-free shape but make sure Redocly does not raise `no-required-schema-properties-undefined`; if it does, follow whatever the existing request bodies in this file do to satisfy it.

- [ ] **Step 2: Add the paths**

Mirroring `/api/v1/libraries/{id}/scans`:

```yaml
  /api/v1/libraries/{id}/transcriptions:
    post:
      operationId: startTranscription
      summary: Start a transcription run for a library
      tags: [Catalog]
      # 202 — the run continues after the response, like a scan.
    get:
      operationId: listLibraryTranscriptions
      summary: Transcription history for a library
      tags: [Catalog]

  /api/v1/libraries/{id}/transcriptions/latest:
    get:
      operationId: getLatestTranscription
      summary: Most recent transcription run for a library
      tags: [Catalog]

  /api/v1/transcriptions/{id}/cancel:
    post:
      operationId: cancelTranscription
      summary: Request cancellation of a running transcription
      tags: [Catalog]

  /api/v1/admin/transcriptions:
    get:
      operationId: listAdminTranscriptions
      summary: Transcription runs across all libraries
      tags: [Admin]
```

Fill in each operation's `parameters`, `requestBody`, and `responses` by copying the shape of the corresponding scan operation in the same file — same `security`, same error responses referencing the shared problem schema. `startTranscription` returns `202` with a `TranscriptionDto`; `cancelTranscription` returns `202`; the `GET`s return `200`. `getLatestTranscription` documents `404` when the library has never been transcribed.

- [ ] **Step 3: Validate, bundle, generate**

```bash
pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen
```

Expected: validation clean. If Redocly warns about undefined required properties on the new schemas, fix the schema — do not silence the rule.

- [ ] **Step 4: Commit in two commits**

```bash
git add packages/specs/openapi/openapi.yaml
git commit -m "feat(specs): describe transcription runs and generated subtitles"

git add packages/api-client-ts/src/generated packages/api-client-dart/lib/generated packages/specs/src/openapi-types.ts
git commit -m "chore(codegen): regenerate clients for transcription routes"
```

---

### Task 9: The run

**Files:**
- Create: `apps/backend/src/modules/catalog/domain/transcription/transcription.repository.ts`
- Create: `apps/backend/src/modules/catalog/infra/prisma-transcription.repository.ts`
- Create: `apps/backend/src/modules/catalog/infra/prisma-transcript.repository.ts`
- Create: `apps/backend/src/modules/catalog/application/commands/run-transcription.{command,handler}.ts`
- Create: `apps/backend/src/modules/catalog/application/commands/cancel-transcription.{command,handler}.ts`
- Create: `apps/backend/src/modules/catalog/application/queries/get-latest-transcription.{query,handler}.ts`
- Create: `apps/backend/src/modules/catalog/application/queries/list-transcriptions.{query,handler}.ts`
- Create: `apps/backend/src/modules/catalog/transcriptions.controller.ts`, `transcriptions.dto.ts`
- Modify: `apps/backend/src/modules/catalog/catalog.module.ts`
- Test: `apps/backend/src/modules/catalog/application/commands/run-transcription.handler.spec.ts`

**Interfaces:**
- Consumes: `Transcription` (Task 6), `decideTranscription` (Task 7), `derivedTranscriptPath` (Task 2), `WhisperAdapter` (Task 4), `FfmpegAdapter.extractAudio` (Task 3), `TranscriptionDto` (Task 8).
- Produces: `RunTranscriptionCommand(libraryId: string, force: boolean, actorUserId: string)` returning the persisted running `Transcription`.

**Handler shape.** Follow `run-scan.handler.ts` exactly:

1. Load the library → `LibraryNotFoundError` when absent.
2. `if (!appConfig.transcription.configured) throw new TranscriptionNotConfiguredError()` — refuse before starting a run that cannot produce anything.
3. Reject when a transcription is already `running` for this library → `TranscriptionAlreadyRunningError`, mirroring `ScanAlreadyRunningError`.
4. Count the library's lessons, persist `Transcription.start({ …, lessonsTotal })` as `running`, and **return it** — the controller answers `202`.
5. `void Promise.resolve().then(() => this.walk(...))` so the response flushes before the CPU-bound work begins, with the same comment `run-scan.handler.ts` carries about why.

**The walk**, per lesson, in outline order:

```ts
// Re-read the aggregate between lessons so a cancel request lands.
const fresh = await this.transcriptions.findById(transcription.id);
if (fresh?.status === 'cancelled') break;

const decision = decideTranscription({
  hasSidecarSubtitle: lesson.subtitles.length > 0,
  existing: existingTranscript,
  video: { mtime: videoStat.mtime, size: videoStat.size },
  force: command.force,
});

if (decision !== 'transcribe') {
  transcription.recordSkipped();
  continue;
}
```

For a lesson that needs transcribing:

```ts
// `-l auto` lets whisper detect the language but gives us nothing to read it
// back from, so an auto run is recorded as `und` — the same convention
// Subtitle.fromFile already uses for a sidecar with no language suffix.
// This also keeps 'auto' out of the filename.
const configured = this.appConfig.transcription.language;
const resolvedLanguage = configured === 'auto' ? 'und' : configured;

const audioPath = path.join(os.tmpdir(), `cs-transcribe-${nanoid()}.wav`);
const outBase = derivedTranscriptPath({
  derivedRoot: this.appConfig.derivedPath,
  libraryId: library.id,
  videoPath: lesson.videoPath,
  language: resolvedLanguage,
}).replace(/\.srt$/, '');

try {
  await fs.mkdir(path.dirname(outBase), { recursive: true });
  await this.ffmpeg.extractAudio({
    videoAbsolutePath: absoluteVideoPath,
    outAbsolutePath: audioPath,
    timeoutMs: AUDIO_EXTRACT_TIMEOUT_MS,
  });
  const { srtAbsolutePath } = await this.whisper.transcribe({
    audioAbsolutePath: audioPath,
    outBaseAbsolutePath: outBase,
  });

  const srt = await fs.readFile(srtAbsolutePath, 'utf8');
  const cues = extractCues(convertSrtToVtt(srt));

  await this.transcripts.replaceGenerated({
    lessonId: lesson.id,
    language: resolvedLanguage,
    sourcePath: lesson.videoPath,
    sourceMtime: videoStat.mtime,
    sourceSize: videoStat.size,
    derivedPath: srtAbsolutePath,
    cues,
  });

  transcription.recordTranscribed();
} catch (error) {
  transcription.recordFailure({
    lessonId: lesson.id,
    message: error instanceof Error ? error.message : String(error),
    code: error instanceof WhisperFailedError ? 'whisper-failed' : 'transcription-failed',
  });
} finally {
  await fs.rm(audioPath, { force: true });
}

await this.transcriptions.save(transcription);
void this.centrifugo.publish(channel, { /* the same envelope run-scan publishes */ });
```

`AUDIO_EXTRACT_TIMEOUT_MS` is a module constant — one hour. Publishing happens once per finished lesson, not on a timer: lessons take minutes, so there is nothing to throttle.

`extractCues` does not exist yet — B1 owns it, but B4 needs it first. Write it now, beside `convertSrtToVtt` in `apps/backend/src/modules/streaming/domain/subtitle-converter.ts`, as a pure `extractCues(vtt: string): { startMs, endMs, text }[]`, with its own unit tests in the existing converter spec covering: a normal file, CRLF input, a missing trailing newline, and a malformed timestamp line being skipped rather than throwing.

- [ ] **Step 1: Write the failing handler test**

Create `run-transcription.handler.spec.ts` modelled on the existing `run-scan.handler.spec.ts` (fake repositories, fake adapters, no real binaries). Cover:

- a library of three lessons — one with a sidecar, one with a current generated transcript, one new → `lessonsSkipped === 2`, `lessonsTranscribed === 1`, status `succeeded`;
- the whisper adapter rejecting for one lesson → `lessonsFailed === 1`, one error entry with code `whisper-failed`, and the run still ends `succeeded`;
- the aggregate reaching `cancelled` between lessons → the walk stops and no further `transcribe` calls are made;
- `configured: false` → `RunTranscriptionCommand` rejects with `TranscriptionNotConfiguredError` and **no** `Transcription` row is persisted;
- a second run while one is `running` → `TranscriptionAlreadyRunningError`;
- the temporary `.wav` is removed on both the success and the failure path.

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm --filter @app/backend test src/modules/catalog/application/commands/run-transcription.handler.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the port, repositories, handlers, DTO and controller**

`TranscriptionRepository` port: `save`, `findById`, `findLatestForLibrary`, `findRunningForLibrary`, `listForLibrary`, `listAll`. `TranscriptRepository` port: `findGenerated(lessonId, language)`, `replaceGenerated(...)` (delete + insert transcript and cues in one transaction), `deleteForLesson(lessonId)`.

`transcriptions.controller.ts` mirrors `scans.controller.ts`: `@UseGuards(AdminGuard)`, `@Controller({ path: 'libraries/:id/transcriptions', version: '1' })`, `@HttpCode(HttpStatus.ACCEPTED)` on the POST. The cancel and admin-list routes live on their own controllers matching their paths.

Register every handler, both repositories bound to their tokens, and `LocalWhisperAdapter` bound to `WHISPER_ADAPTER`, in `catalog.module.ts` alongside `RunScanHandler`.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @app/backend test src/modules/catalog`
Expected: PASS, including the untouched scan tests.

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm --filter @app/backend typecheck
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog apps/backend/src/modules/streaming/domain/subtitle-converter.ts
git commit -m "feat(backend): run whisper transcription over a library

Modelled on the scan: 202, work continues after the response, per-lesson
errors recorded without failing the run, cancellation checked between lessons.
Re-running skips what is already done, which is why no durable queue is needed."
```

---

### Task 10: Serve generated transcripts

**Files:**
- Modify: `apps/backend/src/modules/streaming/domain/lesson-file-locator.ts`
- Modify: `apps/backend/src/modules/catalog/application/queries/get-lesson.handler.ts` (or wherever `LessonDto.subtitles` is assembled)
- Test: the locator's existing spec, plus the lesson query's spec

- [ ] **Step 1: Write the failing tests**

In the locator spec: `locateSubtitle` returns the derived path when no sidecar matches the language but a generated `Transcript` does; a sidecar still wins when both exist; a generated transcript whose `derivedPath` escapes the derived root raises rather than being served.

In the lesson query spec: `subtitles[]` includes generated tracks with `generated: true`, sidecars without the flag, and both when a lesson has one of each in different languages.

- [ ] **Step 2: Run them and watch them fail**

Run: `pnpm --filter @app/backend test src/modules/streaming src/modules/catalog/application/queries`

- [ ] **Step 3: Implement**

`locateSubtitle` gains one branch after the existing sidecar lookup fails: load the generated `Transcript` for `(lessonId, language)`, resolve its `derivedPath` against `path.resolve(appConfig.derivedPath, libraryId)` behind a `path.relative` traversal guard, `stat` it, and return it with `extension: '.srt'` so the controller's existing `.srt → WebVTT` conversion path handles it unchanged.

The lesson query unions sidecar `Subtitle` rows with generated `Transcript` rows, setting `generated: true` on the latter.

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @app/backend test src/modules/streaming src/modules/catalog`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/streaming apps/backend/src/modules/catalog
git commit -m "feat(backend): serve generated transcripts as subtitle tracks"
```

---

### Task 11: Move thumbnails to the derived volume, and clean up orphans

Decision E5 of the spec. Without this the repository has a writable artefact location and the one pre-existing writable-artefact bug (tuxedo 35) sitting next to it unfixed.

**Files:**
- Modify: `apps/backend/src/modules/catalog/application/commands/run-scan.handler.ts`
- Test: `apps/backend/src/modules/catalog/application/commands/run-scan.handler.spec.ts`

- [ ] **Step 1: Write the failing tests**

- A scan writes its thumbnail under `derivedPath/<libraryId>/…`, never under the library root.
- A scan whose thumbnail write fails records a `ScanError` and continues — the failure is per-file, not fatal.
- A scan that no longer finds a lesson deletes that lesson's `Transcript` rows and its generated file.

- [ ] **Step 2: Run and watch fail**

Run: `pnpm --filter @app/backend test src/modules/catalog/application/commands/run-scan.handler.spec.ts`

- [ ] **Step 3: Implement**

Point the thumbnail output at the derived root using the same per-library mirroring as `derivedTranscriptPath`, `mkdir -p` its parent first, and call `TranscriptRepository.deleteForLesson` for lessons that vanished, unlinking `derivedPath` best-effort.

- [ ] **Step 4: Run the tests, then close the tuxedo task**

```bash
pnpm --filter @app/backend test src/modules/catalog
tuxedo list --json   # re-list: N shifts. Find the "release-compose монтирует COURSES_PATH как :ro" row.
tuxedo done <N>
```

- [ ] **Step 5: Commit**

```bash
pnpm --filter @app/backend lint --fix && pnpm format
git add apps/backend/src/modules/catalog
git commit -m "fix(backend): write scan thumbnails to the derived volume

COURSES_PATH is read-only in prod, so every thumbnail write failed there and
recorded a scan error. Closes the ffmpeg-thumbnail-failed class of failures."
```

---

### Task 12: The admin card

**Files:**
- Create: `apps/web/app/components/admin/AdminTranscriptionCard.vue`
- Test: `apps/web/app/components/admin/__tests__/AdminTranscriptionCard.spec.ts`
- Modify: `apps/web/app/pages/admin/libraries/[id].vue`
- Modify: `apps/web/i18n/locales/en.ts`, `apps/web/i18n/locales/ru.ts`

- [ ] **Step 1: Write the failing component spec**

Mount with props and assert: idle state offers Start; a `running` transcription shows `skipped / transcribed / failed` counters against the total and offers Cancel, not Start; the force checkbox is included in the `start` event payload; the error list renders one row per `TranscriptionErrorDto`; a `succeeded` run shows the finished time.

Follow `AdminScansTable.spec.ts` for mounting style and prop-passed translations — the component takes translated strings as props, it does not call `t()` itself, matching every other `Admin*` component.

- [ ] **Step 2: Run and watch fail**

Run: `pnpm --filter @app/web test app/components/admin/__tests__/AdminTranscriptionCard.spec.ts`

- [ ] **Step 3: Implement the component and wire the page**

The page owns the API calls (`startTranscription`, `cancelTranscription`, `getLatestTranscription` from `@app/api-client-ts`) and the Centrifugo subscription, reusing whatever composable the scan card already uses for live progress. All strings come from `pages.admin.transcription.*` in both locales.

- [ ] **Step 4: Run the suite and the i18n gate**

```bash
pnpm --filter @app/web test
pnpm check:i18n
```

- [ ] **Step 5: Format, lint, commit**

```bash
pnpm --filter @app/web lint --fix && pnpm stylelint:fix && pnpm format
git add apps/web
git commit -m "feat(web): add the transcription card to the admin library screen"
```

---

### Task 13: Documentation

**Files:**
- Modify: `README.md`, `README.ru.md` (env table, kept in sync)
- Modify: `docs/deployment.md`, `docs/deploy-ugreen-nas-dockge.md`
- Modify: `docs/user-guide.md`
- Modify: `docs/architecture.md`

- [ ] **Step 1: Write it**

- README (both languages): `DERIVED_PATH`, `WHISPER_PATH`, `WHISPER_MODEL_PATH`, `WHISPER_THREADS`, `WHISPER_LANGUAGE`, `WHISPER_TIMEOUT_MS` in the environment table.
- `docs/deployment.md`: the derived volume, and how to fetch a ggml model — with real sizes (`ggml-base` ~150 MB, `ggml-medium` ~1.5 GB) and the note that the model is mounted, not baked into the image.
- `docs/deploy-ugreen-nas-dockge.md`: the same two mounts in the NAS walkthrough, plus an honest sentence about throughput on NAS-grade CPU.
- `docs/user-guide.md`: a Transcription subsection under Administration — what it does, that hand-made subtitles are never overwritten, that a run is resumable and cancellable, and that generated tracks are labelled as such in the player.
- `docs/architecture.md`: transcription in the catalog context, and the derived-artefact volume as a named concept.

- [ ] **Step 2: Format and commit**

```bash
pnpm format
git add README.md README.ru.md docs/
git commit -m "docs: document transcription setup, volumes and behaviour"
```

---

## Closing out

- [ ] Move `T-2026-08-29-008` from `specs/tasks/active.md` to the top of `specs/tasks/done.md` with `- Completed:` and `- Result: <PR link>`.
- [ ] Prepend a dated entry to the dnote `CHANGELOG course_shelf` note.
- [ ] Open the PR against `main`.
- [ ] After merge, run one real transcription on a single short lesson to confirm the binary, model mount, and derived volume all line up in the deployed stack. Nothing in CI proves this.

## Deliberately not in this plan

- The `pg_trgm` index and transcript search — B1 and B2, which now shrink because B4 fills `TranscriptCue` as it goes.
- The transcript panel in the player — B3, planned in `2026-08-29-b3-transcript-panel.md`.
- Editing a generated transcript in the UI, translation, GPU acceleration, speaker diarisation — §11 of the spec.

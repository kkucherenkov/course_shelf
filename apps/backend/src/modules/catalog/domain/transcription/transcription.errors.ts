/**
 * WHY this file exists:
 * Domain errors for the transcription bounded context, mirroring
 * `scan/scan.errors.ts`. All extend the shared kernel so HttpExceptionFilter
 * maps them to application/problem+json without HTTP logic in the domain.
 *
 * `WhisperFailedError` and `AudioExtractionFailedError` never reach a request
 * handler: both are caught inside the run and recorded against the lesson, so
 * one bad video costs its own lesson, never the whole transcription.
 */
import { DomainError } from '../../../../shared/domain-error';

/**
 * Thrown by `derivedTranscriptPath` when the resolved path lands outside the
 * derived root. Fail closed — a 500 is correct because it means our own data
 * (or an attacker-supplied path) is not what the invariant assumed.
 */
export class DerivedPathEscapedError extends DomainError {
  constructor(attempted: string) {
    super({
      code: 'derived-path-escaped',
      status: 500,
      title: 'Derived path escaped the derived root',
      detail: `Refusing to resolve a derived path outside DERIVED_PATH: "${attempted}".`,
    });
    this.name = 'DerivedPathEscapedError';
  }
}

/**
 * Thrown when a transcription is requested while WHISPER_MODEL_PATH is unset.
 *
 * WHY 503 and not the 422 this class first carried: `POST /libraries/{id}/
 * transcriptions` documents exactly one status for an unusable engine — 503,
 * "the whisper binary or the model file configured for this deployment is
 * missing" — and documents no 422 at all. A 422 here would be response drift:
 * `express-openapi-validator` has no schema for it and turns the reply into a
 * 400 outside production. The contract is the source of truth, so the error
 * moved to meet it.
 */
export class TranscriptionNotConfiguredError extends DomainError {
  constructor() {
    super({
      code: 'transcription-not-configured',
      status: 503,
      title: 'Service Unavailable',
      detail: 'WHISPER_MODEL_PATH is unset, so no whisper model is available.',
    });
    this.name = 'TranscriptionNotConfiguredError';
  }
}

/**
 * Thrown when a run is requested for a library that already has one going.
 * Mirrors `ScanAlreadyRunningError`; the contract documents 409 for it.
 */
export class TranscriptionAlreadyRunningError extends DomainError {
  constructor(libraryId: string) {
    super({
      code: 'transcription-already-running',
      status: 409,
      title: 'Conflict',
      detail: `A transcription is already running for library ${libraryId}.`,
    });
    this.name = 'TranscriptionAlreadyRunningError';
  }
}

/** No transcription run with that id, or none has ever run for the library. */
export class TranscriptionNotFoundError extends DomainError {
  constructor(detail: string) {
    super({
      code: 'transcription-not-found',
      status: 404,
      title: 'Not Found',
      detail,
    });
    this.name = 'TranscriptionNotFoundError';
  }
}

/**
 * Thrown by `LocalWhisperAdapter.transcribe()` when the whisper child process
 * exits non-zero or the timeout elapses. Caught inside the run and turned into
 * a per-lesson error record.
 */
export class WhisperFailedError extends DomainError {
  constructor(audioPath: string, detail: string) {
    super({
      code: 'whisper-failed',
      status: 500,
      title: 'whisper failed',
      detail: `whisper on "${audioPath}" failed: ${detail}`,
    });
    this.name = 'WhisperFailedError';
  }
}

/**
 * Thrown when a mutator (recordSkipped, complete, cancel, …) is called on a run
 * that has already reached `succeeded` / `failed` / `cancelled`.
 *
 * WHY 409 and not the 422 its Scan counterpart uses: the one place this reaches
 * a request handler is `POST /transcriptions/{id}/cancel`, whose contract
 * documents 409 for "already terminal". Inside the walk it is a bug guard and
 * the status never surfaces.
 */
export class TranscriptionInTerminalStateError extends DomainError {
  constructor(status: string) {
    super({
      code: 'transcription-in-terminal-state',
      status: 409,
      title: 'Conflict',
      detail: `Transcription is already in terminal state "${status}" and cannot be mutated.`,
    });
    this.name = 'TranscriptionInTerminalStateError';
  }
}

/**
 * Thrown by `LocalFfmpegAdapter.extractAudio()` when ffmpeg exits non-zero or
 * exceeds its timeout. Never surfaces in a request handler — the run catches it
 * and records a TranscriptionErrorRecord so the next lesson still gets its turn.
 */
export class AudioExtractionFailedError extends DomainError {
  constructor(videoPath: string, reason: string) {
    super({
      code: 'audio-extract-failed',
      status: 500,
      title: 'Audio extraction failed',
      detail: `Audio extraction for "${videoPath}" failed: ${reason}`,
    });
    this.name = 'AudioExtractionFailedError';
  }
}

/**
 * WHY this file exists:
 * Domain errors for the transcription bounded context, mirroring
 * `scan/scan.errors.ts`. All extend the shared kernel so HttpExceptionFilter
 * maps them to application/problem+json without HTTP logic in the domain.
 *
 * `WhisperFailedError` never reaches a request handler: it is caught inside
 * the run and recorded against the lesson so one bad video costs its own
 * lesson, never the whole transcription.
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
 * 422 — the request is well-formed but the instance cannot honour it.
 */
export class TranscriptionNotConfiguredError extends DomainError {
  constructor() {
    super({
      code: 'transcription-not-configured',
      status: 422,
      title: 'Transcription is not configured',
      detail: 'WHISPER_MODEL_PATH is unset, so no whisper model is available.',
    });
    this.name = 'TranscriptionNotConfiguredError';
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

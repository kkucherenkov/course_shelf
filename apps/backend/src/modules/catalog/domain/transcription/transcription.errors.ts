/**
 * WHY this file exists:
 * Domain errors for the transcription bounded context, mirroring
 * `scan/scan.errors.ts`. They extend the shared kernel so `HttpExceptionFilter`
 * renders them as application/problem+json without HTTP logic in the domain.
 */
import { DomainError } from '../../../../shared/domain-error';

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

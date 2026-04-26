/**
 * WHY this file exists:
 * Domain errors for the Scan aggregate. Four failure modes:
 *   - ScanInTerminalStateError   — mutator called on a completed/failed/cancelled scan (422)
 *   - ScanNotFoundError          — scan lookup returned nothing (404)
 *   - ScanAlreadyRunningError    — a second POST fires while another scan is still running (409)
 *   - CourseJsonInvalidError     — course.json does not conform to the v1 schema (422);
 *       NOTE: this is never thrown from a request handler — it is caught inside the walk
 *       and wrapped into a ScanError row, so callers always get a 202 with an error entry.
 *
 * All errors extend shared kernel types so HttpExceptionFilter maps them to
 * application/problem+json without HTTP logic leaking into the domain.
 */
import { DomainError, InvariantViolation, NotFound } from '../../../../shared/domain-error';

/** Thrown when a mutator (recordError, complete, fail, …) is called on a terminal scan. */
export class ScanInTerminalStateError extends InvariantViolation {
  constructor(status: string) {
    super(
      `Scan is already in terminal state "${status}" and cannot be mutated.`,
      'scan-in-terminal-state',
    );
    this.name = 'ScanInTerminalStateError';
  }
}

/** Thrown by the query handler when no scan exists for the requested id. */
export class ScanNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Scan "${id}" does not exist.`, 'scan-not-found');
    this.name = 'ScanNotFoundError';
  }
}

/**
 * Thrown by the command handler when a scan is already running for this library.
 * 409 Conflict — the request is valid but clashes with current state.
 */
export class ScanAlreadyRunningError extends DomainError {
  constructor(libraryId: string) {
    super({
      code: 'scan-already-running',
      status: 409,
      title: 'Scan already running',
      detail: `A scan is already running for library "${libraryId}".`,
    });
    this.name = 'ScanAlreadyRunningError';
  }
}

/**
 * Thrown by the course.json parser when the document does not conform to v1 schema.
 * Never surfaces in a request handler — caught inside the async walk and turned
 * into a ScanError row so the scan continues.
 */
export class CourseJsonInvalidError extends DomainError {
  constructor(path: string, detail: string) {
    super({
      code: 'course-json-invalid',
      status: 422,
      title: 'Invalid course.json',
      detail: `course.json at "${path}" is invalid: ${detail}`,
    });
    this.name = 'CourseJsonInvalidError';
  }
}

/**
 * Thrown by LocalFfmpegAdapter.probe() when ffprobe exits non-zero, returns
 * unparseable JSON, or the video stream is missing required fields.
 * Never surfaces in a request handler — caught inside the scan walk and wrapped
 * into a ScanError row so the scan continues.
 */
export class FfmpegProbeError extends DomainError {
  constructor(path: string, detail: string) {
    super({
      code: 'ffmpeg-probe-failed',
      status: 500,
      title: 'ffprobe failed',
      detail: `ffprobe on "${path}" failed: ${detail}`,
    });
    this.name = 'FfmpegProbeError';
  }
}

/**
 * Thrown by LocalFfmpegAdapter.writeThumbnail() when ffmpeg exits non-zero.
 * Never surfaces in a request handler — caught inside the scan walk and wrapped
 * into a ScanError row so the scan continues.
 */
export class FfmpegThumbnailError extends DomainError {
  constructor(path: string, detail: string) {
    super({
      code: 'ffmpeg-thumbnail-failed',
      status: 500,
      title: 'ffmpeg thumbnail write failed',
      detail: `ffmpeg thumbnail for "${path}" failed: ${detail}`,
    });
    this.name = 'FfmpegThumbnailError';
  }
}

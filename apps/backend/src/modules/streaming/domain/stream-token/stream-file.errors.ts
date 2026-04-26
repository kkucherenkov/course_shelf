/**
 * WHY this file exists:
 * Typed errors for the "stream file" surface inside the Streaming bounded context.
 * All errors extend DomainError; HttpExceptionFilter maps them to RFC 9457
 * problem+json responses without any HTTP logic in the domain layer.
 *
 *   LessonFilePathEscapedError — 500. The resolved absolute path of a lesson video
 *     does not stay inside the configured library root. This is a defensive failure
 *     (data integrity violation) and must fail closed — we never expose filesystem
 *     internals to the client.
 *
 *   LessonFileNotFoundError — 404. The lesson entity exists in the database but
 *     the video file is absent on disk (deleted, moved, or scan hasn't run yet).
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

/**
 * Thrown when the absolute path computed from `lesson.videoPath + library.rootPath`
 * resolves to a location outside the library root directory. This indicates either
 * a corrupt record or a traversal attempt. Status 500 — the client should not
 * learn which check failed or why, so we surface a generic server error.
 */
export class LessonFilePathEscapedError extends DomainError {
  constructor(lessonId: string) {
    super({
      code: 'lesson-file-path-escaped',
      status: 500,
      title: 'Internal error',
      detail: `Resolved path for lesson "${lessonId}" escapes the library root.`,
    });
    this.name = 'LessonFilePathEscapedError';
  }
}

/**
 * Thrown when the lesson row exists but the video file is absent on disk.
 * Status 404 — the resource is temporarily unavailable; re-scanning the library
 * would repopulate it.
 */
export class LessonFileNotFoundError extends NotFound {
  constructor(lessonId: string) {
    super(`Video file for lesson "${lessonId}" was not found on disk.`, 'lesson-file-not-found');
    this.name = 'LessonFileNotFoundError';
  }
}

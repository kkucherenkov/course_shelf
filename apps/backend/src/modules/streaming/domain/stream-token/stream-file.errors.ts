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
 *
 *   SubtitleNotFoundError — 404. The lesson has no subtitle track for the
 *     requested language, or the subtitle's file extension is not `.srt`/`.vtt`.
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

/**
 * Thrown when a subtitle track in the requested language does not exist on the
 * lesson, or the subtitle path carries an unrecognised extension. Status 404.
 */
export class SubtitleNotFoundError extends NotFound {
  constructor(lessonId: string, language: string) {
    super(
      `No subtitle with language "${language}" found for lesson "${lessonId}".`,
      'subtitle-not-found',
    );
    this.name = 'SubtitleNotFoundError';
  }
}

/**
 * Thrown when no material with the given id exists on the lesson. Status 404.
 */
export class MaterialNotFoundError extends NotFound {
  constructor(lessonId: string, materialId: string) {
    super(`No material "${materialId}" found on lesson "${lessonId}".`, 'material-not-found');
    this.name = 'MaterialNotFoundError';
  }
}

/**
 * Thrown when the material entity exists but the backing file is absent on
 * disk. Status 404 — library re-scan would repopulate it.
 */
export class MaterialFileNotFoundError extends NotFound {
  constructor(materialId: string) {
    super(`File for material "${materialId}" was not found on disk.`, 'material-file-not-found');
    this.name = 'MaterialFileNotFoundError';
  }
}

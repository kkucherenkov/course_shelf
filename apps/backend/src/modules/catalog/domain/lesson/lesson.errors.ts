/**
 * WHY this file exists:
 * Domain errors for the Lesson aggregate. Each error has a stable `code` slug
 * so clients can key i18n / retry logic off it. HTTP status codes are set here;
 * HttpExceptionFilter translates them — no HTTP exceptions leak into the domain.
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

/** Thrown when a lesson is looked up by id and no row is found. */
export class LessonNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Lesson "${id}" does not exist.`, 'lesson-not-found');
    this.name = 'LessonNotFoundError';
  }
}

/** Thrown when two lessons within a section share the same 1-based position. */
export class LessonPositionConflictError extends DomainError {
  constructor(detail: string) {
    super({
      code: 'lesson-position-conflict',
      status: 409,
      title: 'Lesson position conflict',
      detail,
    });
    this.name = 'LessonPositionConflictError';
  }
}

/**
 * Thrown by Material.fromFile when the file extension is not in the supported
 * set. The scan handler catches this and records a ScanError — it is never
 * bubbled to the HTTP layer.
 */
export class MaterialKindUnsupportedError extends DomainError {
  constructor(extension: string) {
    super({
      code: 'material-kind-unsupported',
      status: 422,
      title: 'Material kind unsupported',
      detail: `File extension "${extension}" cannot be classified as a material kind.`,
    });
    this.name = 'MaterialKindUnsupportedError';
  }
}

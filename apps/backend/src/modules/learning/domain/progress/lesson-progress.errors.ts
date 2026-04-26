/**
 * WHY this file exists:
 * Domain errors for the LessonProgress aggregate. Each subclass maps to a
 * distinct HTTP status via HttpExceptionFilter — no NestJS exceptions needed
 * in the domain or application layers.
 *
 * Out-of-order writes are NOT errors; the aggregate returns `accepted: false`
 * as a normal outcome. Only structural invariant violations and "not found"
 * cases are errors.
 */
import { InvariantViolation, NotFound } from '../../../../shared/domain-error';

export class LessonProgressInvalidError extends InvariantViolation {
  constructor(detail: string) {
    super(detail, 'lesson-progress-invalid');
    this.name = 'LessonProgressInvalidError';
  }
}

export class LessonProgressNotFoundError extends NotFound {
  constructor(lessonId: string) {
    super(`No progress record found for lesson "${lessonId}".`, 'lesson-progress-not-found');
    this.name = 'LessonProgressNotFoundError';
  }
}

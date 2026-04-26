/**
 * WHY this file exists:
 * Domain errors for the Note aggregate. Each subclass maps to a distinct
 * HTTP status via HttpExceptionFilter — no NestJS exceptions in domain or
 * application layers.
 */
import { InvariantViolation, NotFound } from '../../../../shared/domain-error';

export class NoteInvalidError extends InvariantViolation {
  constructor(detail: string) {
    super(detail, 'note-invalid');
    this.name = 'NoteInvalidError';
  }
}

export class NoteNotFoundError extends NotFound {
  constructor(lessonId: string) {
    super(`Note for lesson "${lessonId}" not found.`, 'note-not-found');
    this.name = 'NoteNotFoundError';
  }
}

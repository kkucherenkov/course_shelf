/**
 * WHY this file exists:
 * Domain errors for the Flashcard aggregate. Each subclass maps to a distinct
 * HTTP status via HttpExceptionFilter — no NestJS exceptions in domain or
 * application layers.
 */
import { DomainError, InvariantViolation, NotFound } from '../../../../shared/domain-error';

export class FlashcardInvalidError extends InvariantViolation {
  constructor(detail: string) {
    super(detail, 'flashcard-invalid');
    this.name = 'FlashcardInvalidError';
  }
}

export class FlashcardUpdateEmptyError extends InvariantViolation {
  constructor() {
    super('At least one of front or back must be provided.', 'flashcard-update-empty');
    this.name = 'FlashcardUpdateEmptyError';
  }
}

export class FlashcardNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Flashcard "${id}" not found.`, 'flashcard-not-found');
    this.name = 'FlashcardNotFoundError';
  }
}

export class FlashcardOwnershipMismatchError extends DomainError {
  constructor() {
    super({
      code: 'flashcard-not-yours',
      status: 403,
      title: 'Permission denied',
      detail: 'You do not own this flashcard.',
    });
    this.name = 'FlashcardOwnershipMismatchError';
  }
}

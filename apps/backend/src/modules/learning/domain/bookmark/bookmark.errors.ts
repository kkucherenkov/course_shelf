/**
 * WHY this file exists:
 * Domain errors for the Bookmark aggregate. Each subclass maps to a distinct
 * HTTP status via HttpExceptionFilter — no NestJS exceptions in domain or
 * application layers.
 */
import { DomainError, InvariantViolation, NotFound } from '../../../../shared/domain-error';

export class BookmarkInvalidError extends InvariantViolation {
  constructor(detail: string) {
    super(detail, 'bookmark-invalid');
    this.name = 'BookmarkInvalidError';
  }
}

export class BookmarkUpdateEmptyError extends InvariantViolation {
  constructor() {
    super('At least one of positionSeconds or label must be provided.', 'bookmark-update-empty');
    this.name = 'BookmarkUpdateEmptyError';
  }
}

export class BookmarkNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Bookmark "${id}" not found.`, 'bookmark-not-found');
    this.name = 'BookmarkNotFoundError';
  }
}

export class BookmarkOwnershipMismatchError extends DomainError {
  constructor() {
    super({
      code: 'bookmark-not-yours',
      status: 403,
      title: 'Permission denied',
      detail: 'You do not own this bookmark.',
    });
    this.name = 'BookmarkOwnershipMismatchError';
  }
}

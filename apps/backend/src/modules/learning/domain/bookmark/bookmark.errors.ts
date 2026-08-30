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

/**
 * WHY: Thrown by the Prisma adapter (P2002 on `uq_bookmark_idempotency`) when
 * two creates race on the same (userId, lessonId, idempotencyKey) — the
 * losing insert failed, not the request. CreateBookmarkHandler catches this
 * internally and re-fetches the winner via `findByIdempotencyKey` to answer
 * with its bookmark instead; it is not expected to reach HttpExceptionFilter
 * (see #285). The 409 mapping exists only as an honest fallback if the
 * re-fetch itself somehow comes up empty.
 */
export class BookmarkIdempotencyConflictError extends DomainError {
  constructor() {
    super({
      code: 'bookmark-idempotency-conflict',
      status: 409,
      title: 'Bookmark idempotency conflict',
      detail: 'A concurrent request already created a bookmark for this idempotency key.',
    });
    this.name = 'BookmarkIdempotencyConflictError';
  }
}

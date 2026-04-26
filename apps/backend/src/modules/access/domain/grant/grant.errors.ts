/**
 * WHY this file exists:
 * Domain errors for the Access bounded context. Extend the shared kernel so
 * HttpExceptionFilter maps them to RFC 9457 problem+json without any HTTP
 * logic leaking into domain or application layers.
 *
 * Three failure cases:
 *   - GrantTargetInvalidError  — target shape violated (422)
 *   - GrantNotFoundError       — looked up by id, not found (404)
 *   - GrantAlreadyExistsError  — (userId, targetKind, libraryId|courseId) already exists (409)
 */
import { DomainError, InvariantViolation, NotFound } from '../../../../shared/domain-error';

/**
 * WHY: Every grant must have exactly one of libraryId / courseId set, matching
 * its discriminator kind. A mismatch means the request is structurally invalid
 * even if the IDs themselves are well-formed.
 */
export class GrantTargetInvalidError extends InvariantViolation {
  constructor(detail: string) {
    super(detail, 'grant-target-invalid');
    this.name = 'GrantTargetInvalidError';
  }
}

/** Thrown when a grant is looked up by id and no row is found. */
export class GrantNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Grant "${id}" does not exist.`, 'grant-not-found');
    this.name = 'GrantNotFoundError';
  }
}

/**
 * WHY: The composite unique constraint (userId, targetKind, libraryId, courseId)
 * enforces idempotency — a user cannot hold duplicate grants on the same target.
 * We surface P2002 as 409 because the request itself is valid; the conflict is
 * situational, not structural.
 */
export class GrantAlreadyExistsError extends DomainError {
  constructor() {
    super({
      code: 'grant-already-exists',
      status: 409,
      title: 'Grant already exists',
      detail: 'The user already has a grant for this target.',
    });
    this.name = 'GrantAlreadyExistsError';
  }
}

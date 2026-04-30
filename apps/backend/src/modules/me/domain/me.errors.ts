import { DomainError, NotFound } from '../../../shared/domain-error';

/** Thrown when the authenticated user's profile row cannot be found (defensive — the session guard guarantees existence in practice). */
export class MeNotFoundError extends NotFound {
  constructor(id: string) {
    super(`User "${id}" does not exist.`, 'me-not-found');
    this.name = 'MeNotFoundError';
  }
}

/**
 * Thrown when PATCH /me is called with an empty body
 * (no patchable field is provided).
 */
export class EmptyMePatchError extends DomainError {
  constructor() {
    super({
      code: 'me-patch-empty',
      status: 400,
      title: 'Bad Request',
      detail: 'At least one field must be provided.',
    });
    this.name = 'EmptyMePatchError';
  }
}

import { DomainError, NotFound } from '../../../shared/domain-error';

/** Thrown when a user is looked up by id and no row is found. */
export class UserNotFoundError extends NotFound {
  constructor(id: string) {
    super(`User "${id}" does not exist.`, 'user-not-found');
    this.name = 'UserNotFoundError';
  }
}

/**
 * Thrown when PATCH /admin/users/:id is called with an empty body
 * (neither `role` nor `banned` is set).
 */
export class EmptyUserPatchError extends DomainError {
  constructor() {
    super({
      code: 'user-patch-empty',
      status: 400,
      title: 'Bad Request',
      detail: 'At least one of `role` or `banned` must be provided.',
    });
    this.name = 'EmptyUserPatchError';
  }
}

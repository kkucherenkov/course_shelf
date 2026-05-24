/**
 * WHY this file exists:
 * Domain errors for the IdentifyTask aggregate, mapped to RFC 9457 by the global
 * filter. NotFound (404) for a missing task; a 409 conflict when a caller tries
 * to apply/discard a task that is no longer in the `proposed` state.
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

export class IdentifyTaskNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Identify task "${id}" does not exist.`, 'identify-task-not-found');
    this.name = 'IdentifyTaskNotFoundError';
  }
}

/** Thrown when apply/discard is attempted on a task that is not in `proposed` state. */
export class IdentifyTaskNotPendingError extends DomainError {
  constructor(id: string, status: string) {
    super({
      code: 'identify-task-not-pending',
      status: 409,
      title: 'Identify task not pending',
      detail: `Identify task "${id}" is "${status}" and can no longer be applied or discarded.`,
    });
    this.name = 'IdentifyTaskNotPendingError';
  }
}

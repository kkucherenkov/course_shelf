/**
 * WHY this file exists:
 * Domain errors specific to the Instructor aggregate. Errors shared across
 * all lightweight aggregates (EntitySlugInvalidError, DisplayNameInvalidError,
 * ExternalIdRefInvalidError) live in shared-vo/shared.errors.ts and are NOT
 * redefined here — only Instructor-specific errors belong in this file.
 *
 * InstructorNotFoundError: thrown by query handlers when an instructor lookup
 * returns null; surfaces as 404.
 *
 * InstructorSlugAlreadyTakenError: thrown by the Prisma adapter when a P2002
 * unique-constraint violation occurs on the slug column; surfaces as 409 so
 * callers can prompt the user to choose a different slug without retrying.
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

/** Thrown when an Instructor is looked up and no row is found. */
export class InstructorNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Instructor "${id}" does not exist.`, 'instructor-not-found');
    this.name = 'InstructorNotFoundError';
  }
}

/**
 * Thrown by the infra adapter when a slug unique constraint is violated
 * (Prisma P2002 → translated in the adapter). Surfaces as 409 so the caller
 * can prompt the user to choose a different slug without retrying blindly.
 */
export class InstructorSlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super({
      code: 'instructor-slug-already-taken',
      status: 409,
      title: 'Instructor slug already taken',
      detail: `An instructor with slug "${slug}" already exists.`,
    });
    this.name = 'InstructorSlugAlreadyTakenError';
  }
}

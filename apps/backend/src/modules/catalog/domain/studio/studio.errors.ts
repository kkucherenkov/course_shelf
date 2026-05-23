/**
 * WHY this file exists:
 * Domain errors specific to the Studio aggregate. Errors shared across
 * all lightweight aggregates (EntitySlugInvalidError, DisplayNameInvalidError,
 * ExternalIdRefInvalidError) live in shared-vo/shared.errors.ts and are NOT
 * redefined here — only Studio-specific errors belong in this file.
 *
 * StudioNotFoundError: thrown by query handlers when a studio lookup
 * returns null; surfaces as 404.
 *
 * StudioSlugAlreadyTakenError: thrown by the Prisma adapter when a P2002
 * unique-constraint violation occurs on the slug column; surfaces as 409 so
 * callers can prompt the user to choose a different slug without retrying.
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

/** Thrown when a Studio is looked up and no row is found. */
export class StudioNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Studio "${id}" does not exist.`, 'studio-not-found');
    this.name = 'StudioNotFoundError';
  }
}

/**
 * Thrown by the infra adapter when a slug unique constraint is violated
 * (Prisma P2002 → translated in the adapter). Surfaces as 409 so the caller
 * can prompt the user to choose a different slug without retrying blindly.
 */
export class StudioSlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super({
      code: 'studio-slug-already-taken',
      status: 409,
      title: 'Studio slug already taken',
      detail: `A studio with slug "${slug}" already exists.`,
    });
    this.name = 'StudioSlugAlreadyTakenError';
  }
}

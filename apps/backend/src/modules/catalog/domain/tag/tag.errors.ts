/**
 * WHY this file exists:
 * Domain errors specific to the Tag aggregate. Errors shared across
 * all lightweight aggregates (EntitySlugInvalidError, DisplayNameInvalidError,
 * ExternalIdRefInvalidError) live in shared-vo/shared.errors.ts and are NOT
 * redefined here — only Tag-specific errors belong in this file.
 *
 * TagNotFoundError: thrown by query handlers when a tag lookup returns null;
 * surfaces as 404.
 *
 * TagSlugAlreadyTakenError: thrown by the Prisma adapter when a P2002
 * unique-constraint violation occurs on the slug column; surfaces as 409.
 *
 * TagCategoryInvalidError: thrown when the category field exceeds 64 characters
 * after trimming; surfaces as 422 (InvariantViolation).
 */
import { DomainError, InvariantViolation, NotFound } from '../../../../shared/domain-error';

/** Thrown when a Tag is looked up and no row is found. */
export class TagNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Tag "${id}" does not exist.`, 'tag-not-found');
    this.name = 'TagNotFoundError';
  }
}

/**
 * Thrown by the infra adapter when a slug unique constraint is violated
 * (Prisma P2002 → translated in the adapter). Surfaces as 409 so the caller
 * can prompt the user to choose a different slug without retrying blindly.
 */
export class TagSlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super({
      code: 'tag-slug-already-taken',
      status: 409,
      title: 'Tag slug already taken',
      detail: `A tag with slug "${slug}" already exists.`,
    });
    this.name = 'TagSlugAlreadyTakenError';
  }
}

/**
 * Thrown when the tag category string exceeds 64 characters after trimming.
 * Surfaces as 422 Unprocessable Entity.
 */
export class TagCategoryInvalidError extends InvariantViolation {
  constructor(length: number) {
    super(
      `Tag category must not exceed 64 characters; got ${String(length)}.`,
      'tag-category-invalid',
    );
    this.name = 'TagCategoryInvalidError';
  }
}

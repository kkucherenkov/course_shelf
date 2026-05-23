/**
 * WHY this file exists:
 * Domain errors for the Course aggregate. Every invariant or conflict that the
 * Course aggregate, its value objects, or the infra adapter can raise is defined
 * here so the application layer stays free of HTTP-specific error types, and the
 * HttpExceptionFilter can translate them to RFC 9457 application/problem+json.
 */
import { DomainError, InvariantViolation, NotFound } from '../../../../shared/domain-error';

// ---------------------------------------------------------------------------
// Slug
// ---------------------------------------------------------------------------

/** Thrown when a slug string does not satisfy the URL-safe regex. */
export class CourseSlugInvalidError extends InvariantViolation {
  constructor(raw: string) {
    super(
      `Course slug "${raw}" is invalid. Must be 1–100 chars, lowercase ASCII letters, digits, ` +
        'and hyphens; cannot start or end with a hyphen.',
      'course-slug-invalid',
    );
    this.name = 'CourseSlugInvalidError';
  }
}

/**
 * Thrown by the infra adapter when a (libraryId, slug) unique constraint is
 * violated (Prisma P2002). Surfaces as 409 so the caller can prompt the user to
 * choose a different slug without retrying blindly.
 */
export class CourseSlugAlreadyTakenError extends DomainError {
  constructor(slug: string) {
    super({
      code: 'course-slug-already-taken',
      status: 409,
      title: 'Course slug already taken',
      detail: `A course with slug "${slug}" already exists in this library.`,
    });
    this.name = 'CourseSlugAlreadyTakenError';
  }
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

/** Thrown when a course or section title is blank or exceeds 200 chars. */
export class CourseTitleInvalidError extends InvariantViolation {
  constructor(reason: string) {
    super(reason, 'course-title-invalid');
    this.name = 'CourseTitleInvalidError';
  }
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

/** Thrown when a position value is not a positive integer. */
export class PositionInvalidError extends InvariantViolation {
  constructor(value: number) {
    super(`Section position must be an integer >= 1; got ${String(value)}.`, 'position-invalid');
    this.name = 'PositionInvalidError';
  }
}

// ---------------------------------------------------------------------------
// Course not found
// ---------------------------------------------------------------------------

/** Thrown when a Course is looked up by id and no row is found. */
export class CourseNotFoundError extends NotFound {
  constructor(id: string) {
    super(`Course "${id}" does not exist.`, 'course-not-found');
    this.name = 'CourseNotFoundError';
  }
}

// ---------------------------------------------------------------------------
// Section errors
// ---------------------------------------------------------------------------

/** Thrown when addSection is called with a duplicate id or duplicate position. */
export class SectionPositionConflictError extends DomainError {
  constructor(detail: string) {
    super({
      code: 'section-position-conflict',
      status: 409,
      title: 'Section position conflict',
      detail,
    });
    this.name = 'SectionPositionConflictError';
  }
}

/** Thrown when an operation references a sectionId that is not in the course. */
export class SectionNotFoundError extends NotFound {
  constructor(sectionId: string) {
    super(`Section "${sectionId}" does not exist in this course.`, 'section-not-found');
    this.name = 'SectionNotFoundError';
  }
}

/** Thrown when reorderSection receives a newPosition outside [1, sections.length]. */
export class SectionPositionOutOfRangeError extends InvariantViolation {
  constructor(newPosition: number, max: number) {
    super(
      `Section newPosition ${String(newPosition)} is out of range [1, ${String(max)}].`,
      'section-position-out-of-range',
    );
    this.name = 'SectionPositionOutOfRangeError';
  }
}

// ---------------------------------------------------------------------------
// Enrichment metadata errors
// ---------------------------------------------------------------------------

/**
 * Thrown when setLanguage receives a string that does not conform to the
 * BCP-47 subset accepted by LanguageTag VO. Wraps LanguageTagInvalidError
 * from shared-vo as cause so the error namespace stays within the Course
 * bounded context.
 */
export class CourseLanguageInvalidError extends InvariantViolation {
  constructor(raw: string, cause?: unknown) {
    super(
      `Course language "${raw}" is invalid. Must be a BCP-47 tag (e.g. "en", "en-US", "zh-Hant").`,
      'course-language-invalid',
    );
    this.name = 'CourseLanguageInvalidError';
    // Preserve the underlying VO error for debugging; DomainError supports `cause` via Error options.
    if (cause !== undefined) {
      (this as { cause: unknown }).cause = cause;
    }
  }
}

/**
 * Thrown when setRating receives an average outside [0, 5] or a count that is
 * not a non-negative integer. Surfaces as 422 Unprocessable Entity.
 */
export class CourseRatingInvalidError extends InvariantViolation {
  constructor(reason: string) {
    super(`Course rating is invalid: ${reason}`, 'course-rating-invalid');
    this.name = 'CourseRatingInvalidError';
  }
}

/**
 * Thrown by the Prisma adapter in set-instructors/studios/tags when a FK
 * violation occurs because a referenced entity does not exist. Defined here
 * (not in the adapter) so command handlers can catch it without forward
 * references into infra/. Surfaces as 404 Not Found.
 */
export class CourseLinkUnknownEntityError extends DomainError {
  constructor(entityType: string, entityId: string) {
    super({
      code: 'course-link-unknown-entity',
      status: 404,
      title: 'Linked entity not found',
      detail: `${entityType} "${entityId}" does not exist and cannot be linked to the course.`,
    });
    this.name = 'CourseLinkUnknownEntityError';
  }
}

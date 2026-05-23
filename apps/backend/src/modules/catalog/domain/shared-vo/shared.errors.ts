/**
 * WHY this file exists:
 * Module-level domain errors shared across all lightweight aggregates
 * (Instructor, Studio, Tag) and their value objects. Keeping them here
 * avoids duplication when each aggregate needs a slug, display-name, or
 * external-id validation error with only the entity name differing.
 *
 * All errors extend InvariantViolation (422) so HttpExceptionFilter maps
 * them to application/problem+json without HTTP logic leaking into domain code.
 *
 * ExternalIdConflictError is defined here (not in the adapter) so
 * application-layer handlers can `instanceof ExternalIdConflictError` without
 * a forward reference into infra/.
 */
import { DomainError, InvariantViolation } from '../../../../shared/domain-error';

/**
 * Thrown when a slug string does not satisfy the URL-safe regex.
 * The entityName is included so the message identifies which aggregate
 * owns the invalid slug (e.g. "Instructor slug "Bad Slug" is invalid...").
 */
export class EntitySlugInvalidError extends InvariantViolation {
  constructor(entityName: string, raw: string) {
    super(
      `${entityName} slug "${raw}" is invalid. Must be 1–100 chars, lowercase ASCII letters, ` +
        'digits, and hyphens; cannot start or end with a hyphen.',
      'entity-slug-invalid',
    );
    this.name = 'EntitySlugInvalidError';
  }
}

/**
 * Thrown when a display name is blank or exceeds the 200-character limit.
 * The entityName and reason are included for clear error messages.
 */
export class DisplayNameInvalidError extends InvariantViolation {
  constructor(entityName: string, reason: string) {
    super(`${entityName} display name is invalid: ${reason}`, 'display-name-invalid');
    this.name = 'DisplayNameInvalidError';
  }
}

/**
 * Thrown when a language tag string does not conform to BCP-47 subset
 * accepted by this system.
 */
export class LanguageTagInvalidError extends InvariantViolation {
  constructor(raw: string) {
    super(
      `Language tag "${raw}" is invalid. Must match BCP-47 pattern: 2–3 letter language subtag ` +
        'optionally followed by hyphen-separated 2–8 alphanumeric subtags (e.g. "en", "en-US", "zh-Hant").',
      'language-tag-invalid',
    );
    this.name = 'LanguageTagInvalidError';
  }
}

/**
 * Thrown when an ExternalIdRef has a blank source/externalId or an
 * invalid URL in the optional url field.
 */
export class ExternalIdRefInvalidError extends InvariantViolation {
  constructor(reason: string) {
    super(`External ID reference is invalid: ${reason}`, 'external-id-ref-invalid');
    this.name = 'ExternalIdRefInvalidError';
  }
}

/**
 * Thrown by the Prisma adapter when a (source, externalId) unique constraint
 * is violated while writing external ids (Prisma P2002 on external_id table).
 * Surfaces as 409 Conflict so the caller can detect the clash and either
 * de-duplicate or prompt for correction.
 */
export class ExternalIdConflictError extends DomainError {
  constructor(source: string, externalId: string) {
    super({
      code: 'external-id-conflict',
      status: 409,
      title: 'External ID conflict',
      detail: `External ID "${externalId}" from source "${source}" is already registered to another entity.`,
    });
    this.name = 'ExternalIdConflictError';
  }
}

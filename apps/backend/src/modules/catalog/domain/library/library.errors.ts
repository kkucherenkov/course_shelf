/**
 * WHY this file exists:
 * Domain errors are the single mechanism for signalling business rule violations
 * in the Catalog bounded context. They extend the shared kernel so the global
 * HttpExceptionFilter can translate them to RFC 9457 problem+json responses
 * without any HTTP logic leaking into domain or application layers.
 *
 * Three failure cases:
 *   - LibraryNameRequiredError   — name was blank (422)
 *   - LibraryPathNotAbsoluteError — rootPath is not an absolute filesystem path (422)
 *   - LibraryAlreadyExistsError  — rootPath is already taken (409); surfaced by
 *     the infra adapter when Prisma raises a P2002 unique-constraint error.
 */
import { DomainError, InvariantViolation } from '../../../../shared/domain-error';

/** WHY: A library without a name is meaningless and unaddressable by users. */
export class LibraryNameRequiredError extends InvariantViolation {
  constructor() {
    super('Library name must not be empty.', 'library-name-required');
    this.name = 'LibraryNameRequiredError';
  }
}

/**
 * WHY: rootPath is used as a filesystem anchor for all media scanning. A
 * relative path has no meaning outside the process working directory and would
 * silently break scanning on any deployment. We validate at construction time
 * so the invariant is enforced in every code path, not just HTTP.
 */
export class LibraryPathNotAbsoluteError extends InvariantViolation {
  constructor(path: string) {
    super(
      `Library rootPath must be an absolute filesystem path; got "${path}".`,
      'library-path-not-absolute',
    );
    this.name = 'LibraryPathNotAbsoluteError';
  }
}

/**
 * WHY: rootPath is a unique constraint at the DB level. Two libraries pointing
 * at the same directory would double-scan files. We surface conflicts as 409
 * rather than 422 because the request itself is valid — the conflict is
 * situational, not structural.
 */
export class LibraryAlreadyExistsError extends DomainError {
  constructor(rootPath: string) {
    super({
      code: 'library-already-exists',
      status: 409,
      title: 'Library already exists',
      detail: `A library with rootPath "${rootPath}" already exists.`,
    });
    this.name = 'LibraryAlreadyExistsError';
  }
}

/** Thrown when a library is looked up by id and no row is found. */
export class LibraryNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      code: 'library-not-found',
      status: 404,
      title: 'Library not found',
      detail: `Library "${id}" does not exist.`,
    });
    this.name = 'LibraryNotFoundError';
  }
}

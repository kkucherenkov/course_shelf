/**
 * Shared kernel: every business-rule violation across bounded contexts extends
 * `DomainError`. The presentation layer (HttpExceptionFilter) maps each one to
 * an RFC 9457 application/problem+json response without any logic in
 * controllers or handlers.
 *
 * Three named subclasses cover the canonical 4xx cases:
 *   - InvariantViolation → 422 Unprocessable Entity
 *   - NotFound           → 404 Not Found
 *   - PermissionDenied   → 403 Forbidden
 *
 * Bounded contexts add their own narrower subclasses on top (see
 * `_template/domain/_template.errors.ts` for an example), keeping `code` slugs
 * stable across deploys so clients can key i18n / retry logic off them.
 */

export interface DomainErrorOptions {
  readonly code: string;
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly cause?: unknown;
}

export class DomainError extends Error {
  readonly code: string;
  readonly status: number;
  readonly title: string;
  readonly detail: string | undefined;

  constructor(options: DomainErrorOptions) {
    super(options.detail ?? options.title, { cause: options.cause });
    this.name = 'DomainError';
    this.code = options.code;
    this.status = options.status;
    this.title = options.title;
    this.detail = options.detail;
  }
}

export class InvariantViolation extends DomainError {
  constructor(detail: string, code = 'invariant-violation') {
    super({ code, status: 422, title: 'Invariant violation', detail });
    this.name = 'InvariantViolation';
  }
}

export class NotFound extends DomainError {
  constructor(detail: string, code = 'not-found') {
    super({ code, status: 404, title: 'Not found', detail });
    this.name = 'NotFound';
  }
}

export class PermissionDenied extends DomainError {
  constructor(detail = 'Access denied.', code = 'permission-denied') {
    super({ code, status: 403, title: 'Permission denied', detail });
    this.name = 'PermissionDenied';
  }
}

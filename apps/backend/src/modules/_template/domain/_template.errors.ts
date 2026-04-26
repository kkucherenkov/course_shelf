/**
 * WHY this file exists:
 * Domain errors are the single mechanism for signalling business rule violations.
 * They extend DomainError so HttpExceptionFilter can map them to RFC 9457
 * application/problem+json responses without any logic in the controller or handler.
 *
 * Add one subclass per distinct failure case in the bounded context. Keep the
 * `code` slug stable — clients key off it for i18n / retry logic.
 */
import { DomainError } from '../../../shared/domain-error';

/** Thrown when the requested resource does not exist in the database. */
export class TemplateNotFoundError extends DomainError {
  constructor(id: string) {
    super({
      code: 'template-not-found',
      status: 404,
      title: 'Template not found',
      detail: `Template ${id} does not exist.`,
    });
  }
}

/** Thrown when the authenticated user does not own the requested resource. */
export class TemplateForbiddenError extends DomainError {
  constructor() {
    super({
      code: 'template-forbidden',
      status: 403,
      title: 'Forbidden',
      detail: 'You do not have access to this template.',
    });
  }
}

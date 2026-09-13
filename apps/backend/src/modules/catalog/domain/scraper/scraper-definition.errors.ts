/**
 * WHY this file exists:
 * The single error a scraper definition file can raise while loading, mirroring
 * CourseJsonInvalidError (domain/scan/scan.errors.ts): caught by
 * ScraperDefinitionLoader per file, never thrown at a caller across an HTTP
 * boundary. It extends DomainError only for shape consistency with the rest of
 * the shared kernel, not because it is ever rendered as a problem+json response.
 */
import { DomainError } from '../../../../shared/domain-error';

export class ScraperDefinitionInvalidError extends DomainError {
  constructor(filePath: string, reason: string) {
    super({
      code: 'scraper-definition-invalid',
      status: 422,
      title: 'Scraper definition invalid',
      detail: `${filePath}: ${reason}`,
    });
    this.name = 'ScraperDefinitionInvalidError';
  }
}

/**
 * WHY this file exists:
 * Domain errors for the scraping subsystem. They extend DomainError so the
 * global HttpExceptionFilter renders them as RFC 9457 problem responses.
 *   - ScraperNotFoundError       → 404 (unknown source id)
 *   - ScraperKindUnsupportedError → 422 (scraper does not support the kind)
 *   - ScraperNotConfiguredError   → 422 (e.g. YouTube without an API key)
 *   - ScrapeFetchError            → 502 (upstream network/timeout/HTTP failure)
 *   - ScrapeParseError            → 502 (upstream returned unparseable content)
 *   - ScrapeFragmentInvalidError  → 422 (caller-supplied fragment is malformed)
 */
import { DomainError, NotFound } from '../../../../shared/domain-error';

export class ScraperNotFoundError extends NotFound {
  constructor(id: string) {
    super(`No scraper registered for source "${id}".`, 'scraper-not-found');
    this.name = 'ScraperNotFoundError';
  }
}

export class ScraperKindUnsupportedError extends DomainError {
  constructor(id: string, kind: string) {
    super({
      code: 'scraper-kind-unsupported',
      status: 422,
      title: 'Scraper kind unsupported',
      detail: `Scraper "${id}" does not support the "${kind}" invocation kind.`,
    });
    this.name = 'ScraperKindUnsupportedError';
  }
}

export class ScraperNotConfiguredError extends DomainError {
  constructor(id: string) {
    super({
      code: 'scraper-not-configured',
      status: 422,
      title: 'Scraper not configured',
      detail: `Scraper "${id}" is not configured on this instance.`,
    });
    this.name = 'ScraperNotConfiguredError';
  }
}

export class ScrapeFetchError extends DomainError {
  constructor(url: string, cause?: unknown) {
    super({
      code: 'scrape-fetch-failed',
      status: 502,
      title: 'Scrape fetch failed',
      detail: `Failed to fetch "${url}" from the upstream source.`,
      cause,
    });
    this.name = 'ScrapeFetchError';
  }
}

export class ScrapeParseError extends DomainError {
  constructor(source: string, detail: string) {
    super({
      code: 'scrape-parse-failed',
      status: 502,
      title: 'Scrape parse failed',
      detail: `Scraper "${source}" could not parse the upstream response: ${detail}`,
    });
    this.name = 'ScrapeParseError';
  }
}

export class ScrapeFragmentInvalidError extends DomainError {
  constructor(detail: string) {
    super({
      code: 'scrape-fragment-invalid',
      status: 422,
      title: 'Scrape fragment invalid',
      detail,
    });
    this.name = 'ScrapeFragmentInvalidError';
  }
}

import { describe, expect, it } from 'vitest';

import {
  ScrapeFetchError,
  ScrapeFragmentInvalidError,
  ScrapeParseError,
  ScraperKindUnsupportedError,
  ScraperNotConfiguredError,
  ScraperNotFoundError,
} from './scraper.errors';

describe('scraper errors', () => {
  it('maps each error to the correct RFC 9457 status and stable code', () => {
    expect(new ScraperNotFoundError('youtube').status).toBe(404);
    expect(new ScraperNotFoundError('youtube').code).toBe('scraper-not-found');

    expect(new ScraperKindUnsupportedError('json-ld', 'name').status).toBe(422);
    expect(new ScraperKindUnsupportedError('json-ld', 'name').code).toBe(
      'scraper-kind-unsupported',
    );
    expect(new ScraperNotConfiguredError('youtube').status).toBe(422);
    expect(new ScraperNotConfiguredError('youtube').code).toBe('scraper-not-configured');

    expect(new ScrapeFetchError('https://x.test').status).toBe(502);
    expect(new ScrapeParseError('udemy', 'no JSON-LD').status).toBe(502);
    expect(new ScrapeFragmentInvalidError('bad json').status).toBe(422);
  });

  it('preserves the cause on fetch errors', () => {
    const cause = new Error('ECONNREFUSED');
    expect(new ScrapeFetchError('https://x.test', cause).cause).toBe(cause);
  });
});

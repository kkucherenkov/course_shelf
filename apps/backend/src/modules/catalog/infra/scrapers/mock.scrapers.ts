/**
 * WHY this file exists:
 * Deterministic, network-free scrapers used when SCRAPERS_MODE=mock (e2e/CI).
 * They mirror the real scrapers' ids and supportedKinds so the registry and
 * controller behave identically without any outbound HTTP.
 */
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

class MockScraper implements Scraper {
  constructor(
    readonly id: string,
    readonly supportedKinds: readonly ScraperKind[],
    private readonly handles: (url: string) => boolean,
  ) {}

  canHandle(url: string): boolean {
    return this.handles(url);
  }

  scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'name' && request.query.trim() === '') return Promise.resolve([]);
    return Promise.resolve([
      {
        source: this.id,
        ...(request.kind === 'url' ? { sourceUrl: request.url } : {}),
        fragment: {
          title: `Mock ${this.id} course`,
          description: 'Deterministic fixture fragment.',
          instructorNames: ['Mock Instructor'],
          studioName: 'Mock Studio',
          tags: ['mock', this.id],
          externalIds: [{ source: this.id, externalId: `${this.id}:mock:1` }],
        },
      },
    ]);
  }
}

function strippedHost(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^(?:www|m)\./, '');
  } catch {
    return null;
  }
}

export function createMockScrapers(): Scraper[] {
  return [
    new MockScraper('youtube', ['url', 'name', 'fragment'], (u) => {
      const h = strippedHost(u);
      return h === 'youtube.com' || h === 'youtu.be';
    }),
    new MockScraper('udemy', ['url', 'name', 'fragment'], (u) => strippedHost(u) === 'udemy.com'),
    new MockScraper('json-ld', ['url', 'fragment'], () => true), // generic fallback last
  ];
}

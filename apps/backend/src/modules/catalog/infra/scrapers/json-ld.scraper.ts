/**
 * WHY this file exists:
 * The generic fallback scraper. Fetches an arbitrary URL (or accepts a raw
 * HTML fragment) and extracts schema.org JSON-LD / OpenGraph metadata. It
 * canHandle() any URL, so the registry must consult it last during URL
 * auto-detection (after the site-specific scrapers).
 */
import type { HtmlMetadataExtractor } from './html-metadata.extractor';
import type { HttpFetcher } from './http-fetcher';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScrapedCourseFragment,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

// Plain class — constructed manually by the SCRAPER_REGISTRY factory in
// catalog.module.ts (and by tests) with positional args. No DI decorators,
// because the registry is built conditionally (e.g. YouTube only when keyed).
export class JsonLdScraper implements Scraper {
  readonly id = 'json-ld';
  readonly supportedKinds: readonly ScraperKind[] = ['url', 'fragment'];

  constructor(
    private readonly fetcher: HttpFetcher,
    private readonly extractor: HtmlMetadataExtractor,
  ) {}

  canHandle(_url: string): boolean {
    return true;
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') {
      const { status, body } = await this.fetcher.fetchText(request.url);
      if (status < 200 || status >= 300) return [];
      return this.toCandidates(this.extractor.extract(body), request.url);
    }
    if (request.kind === 'fragment') {
      return this.toCandidates(this.extractor.extract(request.raw));
    }
    return [];
  }

  private toCandidates(fragment: ScrapedCourseFragment, sourceUrl?: string): ScrapeCandidate[] {
    if (Object.keys(fragment).length === 0) return [];
    return [{ fragment, source: this.id, ...(sourceUrl ? { sourceUrl } : {}) }];
  }
}

/**
 * WHY this file exists:
 * Bespoke scraper for Udemy course landing pages. Udemy embeds schema.org
 * Course JSON-LD, so we reuse HtmlMetadataExtractor and enrich it with a
 * udemy: external id derived from the course slug in the URL. Deliberately
 * defensive — the page layout is brittle and may change without notice, so any
 * miss yields an empty result rather than an error. name-search is best-effort.
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

// Plain class — constructed manually by the SCRAPER_REGISTRY factory (and tests)
// with positional args, like the other scrapers.
export class UdemyScraper implements Scraper {
  readonly id = 'udemy';
  readonly supportedKinds: readonly ScraperKind[] = ['url', 'name', 'fragment'];

  constructor(
    private readonly fetcher: HttpFetcher,
    private readonly extractor: HtmlMetadataExtractor,
  ) {}

  canHandle(url: string): boolean {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^(?:www|m)\./, '');
      return host === 'udemy.com' && u.pathname.includes('/course/');
    } catch {
      return false;
    }
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') return this.scrapeUrl(request.url);
    if (request.kind === 'fragment') {
      const fragment = this.extractor.extract(request.raw);
      return Object.keys(fragment).length === 0 ? [] : [{ fragment, source: this.id }];
    }
    // name-kind: best-effort. Udemy has no stable public search; return empty
    // until/if an official API is wired. Documented as expected behaviour.
    return [];
  }

  private async scrapeUrl(url: string): Promise<ScrapeCandidate[]> {
    const { status, body } = await this.fetcher.fetchText(url);
    if (status < 200 || status >= 300) return [];
    const base = this.extractor.extract(body);
    if (Object.keys(base).length === 0) return [];
    const slug = this.courseSlug(url);
    const fragment: ScrapedCourseFragment = slug
      ? {
          ...base,
          externalIds: [
            ...(base.externalIds ?? []),
            { source: 'udemy', externalId: `udemy:course:${slug}`, url },
          ],
        }
      : base;
    return [{ fragment, source: this.id, sourceUrl: url }];
  }

  private courseSlug(url: string): string | undefined {
    try {
      const segments = new URL(url).pathname.split('/').filter(Boolean);
      const idx = segments.indexOf('course');
      return idx === -1 ? undefined : segments[idx + 1];
    } catch {
      return undefined;
    }
  }
}

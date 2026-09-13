/**
 * WHY this file exists:
 * Bespoke scraper for Udemy course landing pages. Udemy embeds schema.org
 * Course JSON-LD, so we reuse HtmlMetadataExtractor and enrich it with a
 * udemy: external id derived from the course slug in the URL. Deliberately
 * defensive — the page layout is brittle and may change without notice, so any
 * miss yields an empty result rather than an error. name-search is best-effort.
 *
 * url-kind fetching is best-effort only in theory: in practice Udemy's course
 * pages sit behind a Cloudflare bot challenge (HttpFetcher throws
 * ScrapeBotChallengeError for it) and the Affiliate API stopped issuing keys
 * on 2025-01-01, so fragment-kind — paste the page's HTML — is the supported
 * path. Its optional `sourceUrl` lets that path mint the same external id a
 * fetch would have.
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
    if (request.kind === 'fragment') return this.scrapeFragment(request.raw, request.sourceUrl);
    // name-kind: best-effort. Udemy has no stable public search; return empty
    // until/if an official API is wired. Documented as expected behaviour.
    return [];
  }

  private async scrapeUrl(url: string): Promise<ScrapeCandidate[]> {
    const { status, body } = await this.fetcher.fetchText(url);
    if (status < 200 || status >= 300) return [];
    const base = this.extractor.extract(body);
    if (Object.keys(base).length === 0) return [];
    return [{ fragment: this.withExternalId(base, url), source: this.id, sourceUrl: url }];
  }

  // The paste-the-HTML path — the only one that works, since Udemy's course
  // pages sit behind a bot challenge and its Affiliate API stopped issuing
  // keys on 2025-01-01. `sourceUrl` is optional: pasted HTML has no URL of its
  // own, but when the operator supplies the page it came from, we can still
  // mint the `udemy:` external id — the one thing a pasted fragment used to lose.
  private scrapeFragment(raw: string, sourceUrl?: string): ScrapeCandidate[] {
    const base = this.extractor.extract(raw);
    if (Object.keys(base).length === 0) return [];
    const fragment = sourceUrl ? this.withExternalId(base, sourceUrl) : base;
    return [{ fragment, source: this.id, ...(sourceUrl ? { sourceUrl } : {}) }];
  }

  private withExternalId(base: ScrapedCourseFragment, url: string): ScrapedCourseFragment {
    const slug = this.courseSlug(url);
    if (!slug) return base;
    return {
      ...base,
      externalIds: [
        ...(base.externalIds ?? []),
        { source: 'udemy', externalId: `udemy:course:${slug}`, url },
      ],
    };
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

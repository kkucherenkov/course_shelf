/**
 * WHY this file exists:
 * One instance per loaded ScraperDefinition (design §4). Fetches (url kind) or
 * accepts a raw fragment, runs both extractors, and merges them with rules
 * winning over the generic extractor on conflict (D3 — a hand-authored site
 * rule is the most specific source there is). `name` kind has no vocabulary
 * here (design out of scope) and is always best-effort empty, like Udemy's.
 */
import type { RuleExtractor } from './rule-extractor';
import type { HtmlMetadataExtractor } from './html-metadata.extractor';
import type { HttpFetcher } from './http-fetcher';
import type { ScraperDefinition } from '../../domain/scraper/scraper-definition.schema';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type {
  ScrapeCandidate,
  ScrapeRequest,
  ScraperKind,
} from '../../domain/scraper/scraper.types';

// Plain class — constructed manually by the SCRAPER_REGISTRY factory (and
// tests), like the other scrapers. No DI decorators.
export class DeclarativeScraper implements Scraper {
  readonly id: string;
  readonly supportedKinds: readonly ScraperKind[];

  constructor(
    private readonly definition: ScraperDefinition,
    private readonly fetcher: HttpFetcher,
    private readonly extractor: HtmlMetadataExtractor,
    private readonly ruleExtractor: RuleExtractor,
  ) {
    this.id = definition.id;
    this.supportedKinds = definition.kinds;
  }

  canHandle(url: string): boolean {
    return this.definition.urlPattern?.test(url) ?? false;
  }

  async scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]> {
    if (request.kind === 'url') {
      const { status, body } = await this.fetcher.fetchText(request.url);
      if (status < 200 || status >= 300) return [];
      return this.toCandidates(body, request.url);
    }
    if (request.kind === 'fragment') {
      return this.toCandidates(request.raw);
    }
    // name-kind: no search vocabulary in a definition (design §7, out of scope).
    return [];
  }

  private toCandidates(html: string, sourceUrl?: string): ScrapeCandidate[] {
    const generic = this.extractor.extract(html);
    const fromRules = this.ruleExtractor.extract(html, this.definition.rules, this.id);
    const fragment = { ...generic, ...fromRules }; // rules win (D3)
    if (Object.keys(fragment).length === 0) return [];
    return [{ fragment, source: this.id, ...(sourceUrl ? { sourceUrl } : {}) }];
  }
}

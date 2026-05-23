/**
 * WHY this file exists:
 * The concrete ScraperRegistry. Constructed with the list of configured
 * scrapers (the module decides which are configured — e.g. YouTube only when a
 * key is present). findByUrl scans in construction order, so callers must place
 * the generic json-ld fallback (canHandle ⇒ true) LAST.
 */
import { ScraperNotFoundError } from '../../domain/scraper/scraper.errors';
import type { Scraper, ScraperRegistry } from '../../domain/scraper/scraper.port';

export class DefaultScraperRegistry implements ScraperRegistry {
  private readonly byId: Map<string, Scraper>;

  constructor(private readonly scrapers: readonly Scraper[]) {
    this.byId = new Map(scrapers.map((s) => [s.id, s]));
  }

  get(id: string): Scraper {
    const scraper = this.byId.get(id);
    if (!scraper) throw new ScraperNotFoundError(id);
    return scraper;
  }

  all(): readonly Scraper[] {
    return this.scrapers;
  }

  findByUrl(url: string): Scraper | undefined {
    return this.scrapers.find((s) => s.canHandle(url));
  }
}

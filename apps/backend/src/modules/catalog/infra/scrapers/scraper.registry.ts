/**
 * WHY this file exists:
 * The concrete ScraperRegistry. Constructed with the list of configured
 * scrapers (the module decides which are configured — e.g. YouTube only when a
 * key is present). findByUrl scans in construction order, so callers must place
 * the generic json-ld fallback (canHandle ⇒ true) LAST.
 *
 * Also retains what buildScraperRegistry's loader rejected (E30-F01-S02): the
 * admin listing needs both what loaded and what didn't, and construction time
 * is the only place that already has both.
 */
import { DeclarativeScraper } from './declarative.scraper';
import { ScraperNotFoundError } from '../../domain/scraper/scraper.errors';
import type { ScraperDefinitionLoadError } from '../../domain/scraper/scraper.types';
import type {
  Scraper,
  ScraperRegistry,
  ScraperRegistryEntry,
} from '../../domain/scraper/scraper.port';

export class DefaultScraperRegistry implements ScraperRegistry {
  private readonly byId: Map<string, Scraper>;

  constructor(
    private readonly scrapers: readonly Scraper[],
    private readonly rejectedDefinitions: readonly ScraperDefinitionLoadError[] = [],
  ) {
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

  entries(): readonly ScraperRegistryEntry[] {
    return this.scrapers.map((scraper) => ({
      scraper,
      origin: scraper instanceof DeclarativeScraper ? 'definition-file' : 'built-in',
    }));
  }

  rejected(): readonly ScraperDefinitionLoadError[] {
    return this.rejectedDefinitions;
  }
}

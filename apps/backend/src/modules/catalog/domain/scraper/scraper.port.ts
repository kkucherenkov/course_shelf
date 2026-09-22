/**
 * WHY this file exists:
 * The Scraper port + SCRAPER_REGISTRY token. Each concrete scraper is a
 * self-contained adapter declaring which invocation kinds it supports and
 * whether it can handle a given URL (for auto-detection). The registry
 * dispatches by id or by URL and exposes only configured scrapers.
 */
import type {
  ScrapeCandidate,
  ScraperDefinitionLoadError,
  ScrapeRequest,
  ScraperKind,
} from './scraper.types';

export interface Scraper {
  readonly id: string;
  readonly supportedKinds: readonly ScraperKind[];
  /** True when this scraper recognises the URL (used for url-kind auto-detect). */
  canHandle(url: string): boolean;
  scrape(request: ScrapeRequest): Promise<ScrapeCandidate[]>;
}

/** Where a scraper's implementation came from (E30-F01-S02 admin listing). */
export type ScraperOrigin = 'built-in' | 'definition-file';

export interface ScraperRegistryEntry {
  readonly scraper: Scraper;
  readonly origin: ScraperOrigin;
}

export interface ScraperRegistry {
  /** @throws ScraperNotFoundError when no scraper with this id is configured. */
  get(id: string): Scraper;
  /** All configured scrapers (unconfigured ones, e.g. YouTube without a key, are excluded). */
  all(): readonly Scraper[];
  /** First configured scraper whose canHandle(url) is true; undefined if none match. */
  findByUrl(url: string): Scraper | undefined;
  /** Every registered scraper paired with its origin, in registration order — admin listing only. */
  entries(): readonly ScraperRegistryEntry[];
  /** Definition files rejected at load time, in load order — admin listing only. */
  rejected(): readonly ScraperDefinitionLoadError[];
}

export const SCRAPER_REGISTRY = Symbol('SCRAPER_REGISTRY');

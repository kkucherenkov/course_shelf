/**
 * WHY this file exists:
 * Builds the real (non-mock) scraper registry: built-ins (YouTube when keyed,
 * Udemy when enabled), then every declarative definition loaded from
 * `$DERIVED_PATH/scrapers`, then the generic json-ld fallback last — pulled
 * out of catalog.module.ts's SCRAPER_REGISTRY factory so the ordering
 * contract (declarative scrapers before json-ld, an id colliding with a
 * built-in rejected) has a unit test that does not require booting Nest.
 *
 * `derivedPath` is AppConfig.derivedPath — the one place that resolution
 * already happens (never process.env here, and no new path-joining scheme:
 * this is a static `scrapers` subdirectory of that same root, not a
 * caller-influenced path, so the traversal guard `derived-path.ts` enforces
 * for per-lesson transcript paths does not apply here).
 *
 * A definition that fails to load is logged and skipped, never thrown —
 * startup must survive every malformed-definition case (D6). Persisting those
 * errors for an admin surface is E30-F01-S02, not built here.
 */
import { Logger } from '@nestjs/common';
import path from 'node:path';

import { DeclarativeScraper } from './declarative.scraper';
import { HtmlMetadataExtractor } from './html-metadata.extractor';
import { HttpFetcher } from './http-fetcher';
import { JsonLdScraper } from './json-ld.scraper';
import { RuleExtractor } from './rule-extractor';
import { ScraperDefinitionLoader } from './scraper-definition.loader';
import { DefaultScraperRegistry } from './scraper.registry';
import { UdemyScraper } from './udemy.scraper';
import { YouTubeScraper } from './youtube.scraper';

import type { ScrapersConfig } from '../../../../common/config/app-config';
import type { Scraper } from '../../domain/scraper/scraper.port';

const logger = new Logger('ScraperDefinitionLoader');

export function buildScraperRegistry(
  scrapers: ScrapersConfig,
  derivedPath: string,
): DefaultScraperRegistry {
  const fetcher = new HttpFetcher(scrapers);
  const extractor = new HtmlMetadataExtractor();
  const list: Scraper[] = [];

  if (scrapers.youtube.configured) {
    list.push(new YouTubeScraper(fetcher, scrapers.youtube.apiKey));
  }
  if (scrapers.udemy.enabled) {
    list.push(new UdemyScraper(fetcher, extractor));
  }

  // Reserved even though json-ld is pushed last, below — an id colliding
  // with the generic fallback is exactly as undebuggable as one colliding
  // with a site-specific built-in (D5).
  const reservedIds = new Set(list.map((s) => s.id));
  reservedIds.add('json-ld');

  const definitionsDir = path.join(derivedPath, 'scrapers');
  const { definitions, errors } = new ScraperDefinitionLoader().load(definitionsDir, reservedIds);
  for (const error of errors) {
    logger.warn(`Skipped "${error.file}": ${error.reason}`);
  }

  const ruleExtractor = new RuleExtractor();
  for (const definition of definitions) {
    list.push(new DeclarativeScraper(definition, fetcher, extractor, ruleExtractor));
  }

  list.push(new JsonLdScraper(fetcher, extractor)); // generic fallback LAST
  return new DefaultScraperRegistry(list);
}

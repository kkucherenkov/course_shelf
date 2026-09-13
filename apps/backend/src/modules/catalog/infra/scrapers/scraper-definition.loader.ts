/**
 * WHY this file exists:
 * Loads every `*.json` scraper definition from a directory (design §5),
 * `$DERIVED_PATH/scrapers` in production — see build-scraper-registry.ts for
 * how that path is resolved (AppConfig.derivedPath, never process.env here).
 *
 * A missing directory is not an error — the normal case for an instance that
 * has never authored a definition. Per file: unreadable, not JSON, schema
 * invalid, bad regex, or a colliding id → one error entry naming the file and
 * the reason; the file is skipped and the walk continues. Startup never fails
 * on a definition (D6, and the card is explicit about it).
 *
 * Synchronous by design: this runs once, at startup, alongside the rest of
 * the (synchronous) SCRAPER_REGISTRY factory — an async loader would force
 * that factory async for a read that happens once per process lifetime.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { parseScraperDefinition } from '../../domain/scraper/scraper-definition.schema';

import type { ScraperDefinition } from '../../domain/scraper/scraper-definition.schema';

export interface ScraperDefinitionLoadError {
  readonly file: string;
  readonly reason: string;
}

export interface ScraperDefinitionLoadResult {
  readonly definitions: readonly ScraperDefinition[];
  readonly errors: readonly ScraperDefinitionLoadError[];
}

export class ScraperDefinitionLoader {
  /**
   * @param reservedIds Built-in scraper ids — a definition colliding with one
   *   is rejected (D5). Ids of definitions loaded earlier in this same pass
   *   are added as the walk goes, so a second file cannot silently shadow the
   *   first either.
   */
  load(dir: string, reservedIds: ReadonlySet<string>): ScraperDefinitionLoadResult {
    let names: string[];
    try {
      names = readdirSync(dir)
        .filter((name) => name.endsWith('.json'))
        .toSorted();
    } catch {
      return { definitions: [], errors: [] };
    }

    const definitions: ScraperDefinition[] = [];
    const errors: ScraperDefinitionLoadError[] = [];
    const seenIds = new Set(reservedIds);

    for (const name of names) {
      const filePath = path.join(dir, name);
      try {
        const raw = readFileSync(filePath, 'utf8');
        const definition = parseScraperDefinition(raw, filePath, seenIds);
        seenIds.add(definition.id);
        definitions.push(definition);
      } catch (error) {
        errors.push({
          file: filePath,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return { definitions, errors };
  }
}

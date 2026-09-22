// scraper.registry.spec.ts
import { describe, expect, it } from 'vitest';

import { DeclarativeScraper } from './declarative.scraper';
import { ScraperNotFoundError } from '../../domain/scraper/scraper.errors';
import { DefaultScraperRegistry } from './scraper.registry';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type { ScraperDefinition } from '../../domain/scraper/scraper-definition.schema';

function stub(id: string, handles: (u: string) => boolean): Scraper {
  return { id, supportedKinds: ['url'], canHandle: handles, scrape: async () => [] };
}

function declarativeStub(id: string): DeclarativeScraper {
  const definition = { id, kinds: ['url'], rules: {} } as unknown as ScraperDefinition;
  return new DeclarativeScraper(
    definition,
    undefined as never,
    undefined as never,
    undefined as never,
  );
}

const youtube = stub('youtube', (u) => u.includes('youtube'));
const jsonLd = stub('json-ld', () => true);

describe('DefaultScraperRegistry', () => {
  it('get() returns by id and throws ScraperNotFoundError otherwise', () => {
    const r = new DefaultScraperRegistry([youtube, jsonLd]);
    expect(r.get('youtube')).toBe(youtube);
    expect(() => r.get('nope')).toThrow(ScraperNotFoundError);
  });

  it('all() returns every registered scraper', () => {
    const r = new DefaultScraperRegistry([youtube, jsonLd]);
    expect(r.all().map((s) => s.id)).toEqual(['youtube', 'json-ld']);
  });

  it('findByUrl() prefers a site-specific scraper over the generic fallback', () => {
    const r = new DefaultScraperRegistry([youtube, jsonLd]);
    expect(r.findByUrl('https://youtube.com/playlist?list=1')?.id).toBe('youtube');
    expect(r.findByUrl('https://example.com')?.id).toBe('json-ld');
  });

  it('entries() marks a DeclarativeScraper instance as definition-file, everything else built-in', () => {
    const declarative = declarativeStub('my-site');
    const r = new DefaultScraperRegistry([youtube, declarative, jsonLd]);
    expect(r.entries()).toEqual([
      { scraper: youtube, origin: 'built-in' },
      { scraper: declarative, origin: 'definition-file' },
      { scraper: jsonLd, origin: 'built-in' },
    ]);
  });

  it('rejected() returns [] by default, and echoes back what the constructor was given otherwise', () => {
    expect(new DefaultScraperRegistry([youtube]).rejected()).toEqual([]);
    const errors = [{ file: '/data/derived/scrapers/bad.json', reason: 'not valid JSON' }];
    expect(new DefaultScraperRegistry([youtube], errors).rejected()).toEqual(errors);
  });
});

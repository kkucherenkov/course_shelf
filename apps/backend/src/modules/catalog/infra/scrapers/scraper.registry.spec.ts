// scraper.registry.spec.ts
import { describe, expect, it } from 'vitest';

import { ScraperNotFoundError } from '../../domain/scraper/scraper.errors';
import { DefaultScraperRegistry } from './scraper.registry';
import type { Scraper } from '../../domain/scraper/scraper.port';

function stub(id: string, handles: (u: string) => boolean): Scraper {
  return { id, supportedKinds: ['url'], canHandle: handles, scrape: async () => [] };
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
});

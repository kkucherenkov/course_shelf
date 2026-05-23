// json-ld.scraper.spec.ts
import { describe, expect, it } from 'vitest';

import { HtmlMetadataExtractor } from './html-metadata.extractor';
import { JsonLdScraper } from './json-ld.scraper';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fakeFetcher(body: string): HttpFetcher {
  return {
    fetchText: async (): Promise<FetchResult> => ({ status: 200, headers: new Headers(), body }),
  } as unknown as HttpFetcher;
}

const html = `<html><head><script type="application/ld+json">
{"@context":"https://schema.org","@type":"Course","name":"Generic Course"}
</script></head></html>`;

describe('JsonLdScraper', () => {
  it('declares id, supported kinds and handles any URL (generic fallback)', () => {
    const s = new JsonLdScraper(fakeFetcher(html), new HtmlMetadataExtractor());
    expect(s.id).toBe('json-ld');
    expect([...s.supportedKinds]).toEqual(['url', 'fragment']);
    expect(s.canHandle('https://anything.test/x')).toBe(true);
  });

  it('scrapes a url into a single candidate', async () => {
    const s = new JsonLdScraper(fakeFetcher(html), new HtmlMetadataExtractor());
    const candidates = await s.scrape({ kind: 'url', url: 'https://x.test/c' });
    expect(candidates).toHaveLength(1);
    expect(candidates.at(0)?.fragment.title).toBe('Generic Course');
    expect(candidates.at(0)?.source).toBe('json-ld');
    expect(candidates.at(0)?.sourceUrl).toBe('https://x.test/c');
  });

  it('returns an empty list when nothing is extractable', async () => {
    const s = new JsonLdScraper(fakeFetcher('<html></html>'), new HtmlMetadataExtractor());
    expect(await s.scrape({ kind: 'url', url: 'https://x.test/c' })).toEqual([]);
  });

  it('parses a raw HTML fragment', async () => {
    const s = new JsonLdScraper(fakeFetcher(''), new HtmlMetadataExtractor());
    const candidates = await s.scrape({ kind: 'fragment', raw: html });
    expect(candidates.at(0)?.fragment.title).toBe('Generic Course');
  });

  // Fix 2: non-2xx response must yield []
  it('returns [] when the upstream returns a 5xx error page (even with valid JSON-LD in body)', async () => {
    const errorFetcher: HttpFetcher = {
      fetchText: async (): Promise<FetchResult> => ({
        status: 500,
        headers: new Headers(),
        body: html, // body contains valid JSON-LD but status is 500 — must be ignored
      }),
    } as unknown as HttpFetcher;
    const s = new JsonLdScraper(errorFetcher, new HtmlMetadataExtractor());
    const candidates = await s.scrape({ kind: 'url', url: 'https://x.test/c' });
    expect(candidates).toEqual([]);
  });
});

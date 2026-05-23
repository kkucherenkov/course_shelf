// udemy.scraper.spec.ts
import { describe, expect, it } from 'vitest';

import { HtmlMetadataExtractor } from './html-metadata.extractor';
import { UdemyScraper } from './udemy.scraper';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fakeFetcher(body: string): HttpFetcher {
  return {
    fetchText: async (): Promise<FetchResult> => ({ status: 200, headers: new Headers(), body }),
  } as unknown as HttpFetcher;
}

const courseHtml = `<html><head><script type="application/ld+json">
{"@context":"https://schema.org","@type":"Course","name":"Docker Mastery",
 "description":"Containers","provider":{"@type":"Organization","name":"Udemy"},
 "aggregateRating":{"ratingValue":4.6,"ratingCount":98765}}
</script></head></html>`;

describe('UdemyScraper', () => {
  it('handles udemy course URLs and supports all kinds', () => {
    const s = new UdemyScraper(fakeFetcher(courseHtml), new HtmlMetadataExtractor());
    expect(s.id).toBe('udemy');
    expect([...s.supportedKinds]).toEqual(['url', 'name', 'fragment']);
    expect(s.canHandle('https://www.udemy.com/course/docker-mastery/')).toBe(true);
    expect(s.canHandle('https://example.com')).toBe(false);
  });

  // Fix 1: host-suffix spoofing guard
  it('rejects evil-udemy.com (host-suffix spoof)', () => {
    const s = new UdemyScraper(fakeFetcher(courseHtml), new HtmlMetadataExtractor());
    expect(s.canHandle('https://evil-udemy.com/course/x/')).toBe(false);
  });

  it('accepts m.udemy.com (mobile subdomain)', () => {
    const s = new UdemyScraper(fakeFetcher(courseHtml), new HtmlMetadataExtractor());
    expect(s.canHandle('https://m.udemy.com/course/docker-mastery/')).toBe(true);
  });

  // Fix 2: non-2xx response must yield []
  it('returns [] when the upstream returns a 5xx error page', async () => {
    const errorFetcher: HttpFetcher = {
      fetchText: async (): Promise<FetchResult> => ({
        status: 500,
        headers: new Headers(),
        body: courseHtml, // contains valid JSON-LD — must still be ignored
      }),
    } as unknown as HttpFetcher;
    const s = new UdemyScraper(errorFetcher, new HtmlMetadataExtractor());
    const candidates = await s.scrape({
      kind: 'url',
      url: 'https://www.udemy.com/course/docker-mastery/',
    });
    expect(candidates).toEqual([]);
  });

  it('scrapes a course landing page via embedded JSON-LD', async () => {
    const s = new UdemyScraper(fakeFetcher(courseHtml), new HtmlMetadataExtractor());
    const candidates = await s.scrape({
      kind: 'url',
      url: 'https://www.udemy.com/course/docker-mastery/',
    });
    expect(candidates).toHaveLength(1);
    expect(candidates.at(0)?.fragment.title).toBe('Docker Mastery');
    expect(candidates.at(0)?.fragment.ratingAverage).toBe(4.6);
    expect(candidates.at(0)?.fragment.externalIds?.at(0)?.source).toBe('udemy');
  });

  it('degrades to an empty list when the page has no metadata', async () => {
    const s = new UdemyScraper(fakeFetcher('<html>blocked</html>'), new HtmlMetadataExtractor());
    expect(await s.scrape({ kind: 'url', url: 'https://www.udemy.com/course/x/' })).toEqual([]);
  });
});

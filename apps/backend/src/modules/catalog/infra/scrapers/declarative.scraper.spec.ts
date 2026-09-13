// declarative.scraper.spec.ts
import { describe, expect, it } from 'vitest';

import { DeclarativeScraper } from './declarative.scraper';
import { HtmlMetadataExtractor } from './html-metadata.extractor';
import { RuleExtractor } from './rule-extractor';

import type { ScraperDefinition } from '../../domain/scraper/scraper-definition.schema';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fakeFetcher(body: string, status = 200): HttpFetcher {
  return {
    fetchText: async (): Promise<FetchResult> => ({ status, headers: new Headers(), body }),
  } as unknown as HttpFetcher;
}

const definition: ScraperDefinition = {
  id: 'my-site',
  kinds: ['url', 'fragment'],
  urlPattern: /^https:\/\/my\.site\/course\//,
  rules: { title: { selector: '.course-title', from: 'text' } },
};

const html = `<html><head><script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Course","name":"Generic Title","description":"Generic desc"}
</script></head><body><h1 class="course-title">Rule Title</h1></body></html>`;

function scraper(body: string, status = 200): DeclarativeScraper {
  return new DeclarativeScraper(
    definition,
    fakeFetcher(body, status),
    new HtmlMetadataExtractor(),
    new RuleExtractor(),
  );
}

describe('DeclarativeScraper', () => {
  it('canHandle matches the compiled urlPattern only', () => {
    const s = scraper(html);
    expect(s.canHandle('https://my.site/course/docker')).toBe(true);
    expect(s.canHandle('https://other.site/course/docker')).toBe(false);
  });

  it('merges extractors with rules winning over the generic extractor', async () => {
    const s = scraper(html);
    const candidates = await s.scrape({ kind: 'url', url: 'https://my.site/course/docker' });
    expect(candidates).toHaveLength(1);
    // rules win (D3): title comes from the CSS rule, not the JSON-LD name.
    expect(candidates[0]?.fragment.title).toBe('Rule Title');
    // fields the rules don't touch still come from the generic extractor.
    expect(candidates[0]?.fragment.description).toBe('Generic desc');
    expect(candidates[0]?.source).toBe('my-site');
    expect(candidates[0]?.sourceUrl).toBe('https://my.site/course/docker');
  });

  it('returns [] on a non-2xx response', async () => {
    const s = scraper(html, 500);
    expect(await s.scrape({ kind: 'url', url: 'https://my.site/course/docker' })).toEqual([]);
  });

  it('scrapes a fragment kind directly from raw HTML', async () => {
    const s = scraper(html);
    const candidates = await s.scrape({ kind: 'fragment', raw: html });
    expect(candidates[0]?.fragment.title).toBe('Rule Title');
    expect(candidates[0]?.sourceUrl).toBeUndefined();
  });

  it('returns [] for name-kind — no search vocabulary in a definition', async () => {
    const s = scraper(html);
    expect(await s.scrape({ kind: 'name', query: 'docker' })).toEqual([]);
  });
});

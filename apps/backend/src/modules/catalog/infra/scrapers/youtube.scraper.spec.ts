// youtube.scraper.spec.ts
import { describe, expect, it, vi } from 'vitest';

import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import { YouTubeScraper } from './youtube.scraper';
import type { FetchResult, HttpFetcher } from './http-fetcher';

function fetcherReturning(map: Record<string, unknown>): HttpFetcher {
  return {
    fetchText: vi.fn(async (url: string): Promise<FetchResult> => {
      const key = Object.keys(map).find((k) => url.includes(k)) ?? '';
      return { status: 200, headers: new Headers(), body: JSON.stringify(map[key] ?? {}) };
    }),
  } as unknown as HttpFetcher;
}

const playlistResponse = {
  items: [
    {
      id: 'PL123',
      snippet: {
        title: 'Rust Course',
        description: 'Learn Rust',
        channelTitle: 'Rustacean',
        thumbnails: { high: { url: 'https://i.ytimg.com/p.jpg' } },
        defaultLanguage: 'en',
      },
    },
  ],
};

describe('YouTubeScraper', () => {
  it('handles youtube URLs and supports url/name/fragment', () => {
    const s = new YouTubeScraper(fetcherReturning({}), 'KEY');
    expect(s.id).toBe('youtube');
    expect([...s.supportedKinds]).toEqual(['url', 'name', 'fragment']);
    expect(s.canHandle('https://www.youtube.com/playlist?list=PL123')).toBe(true);
    expect(s.canHandle('https://youtu.be/abc')).toBe(true);
    expect(s.canHandle('https://example.com')).toBe(false);
  });

  it('scrapes a playlist URL into a candidate', async () => {
    const s = new YouTubeScraper(fetcherReturning({ 'playlists?': playlistResponse }), 'KEY');
    const candidates = await s.scrape({
      kind: 'url',
      url: 'https://www.youtube.com/playlist?list=PL123',
    });
    expect(candidates).toHaveLength(1);
    expect(candidates.at(0)?.fragment.title).toBe('Rust Course');
    expect(candidates.at(0)?.fragment.studioName).toBe('Rustacean');
    expect(candidates.at(0)?.fragment.externalIds).toEqual([
      { source: 'youtube', externalId: 'youtube:playlist:PL123', url: expect.any(String) },
    ]);
  });

  it('returns empty when a url has no recognisable playlist or video id', async () => {
    const s = new YouTubeScraper(fetcherReturning({}), 'KEY');
    expect(await s.scrape({ kind: 'url', url: 'https://youtube.com/feed' })).toEqual([]);
  });

  // Fix 3: 4xx/5xx from YouTube API must throw ScrapeFetchError with key-free URL
  it('rejects with ScrapeFetchError (not silent []) when YouTube API returns 403, and detail must not contain the api key', async () => {
    const API_KEY = 'SECRET_API_KEY_12345';
    const forbiddenFetcher: HttpFetcher = {
      fetchText: vi.fn(
        async (): Promise<FetchResult> => ({
          status: 403,
          headers: new Headers(),
          body: JSON.stringify({ error: { code: 403, message: 'quotaExceeded' } }),
        }),
      ),
    } as unknown as HttpFetcher;
    const s = new YouTubeScraper(forbiddenFetcher, API_KEY);
    let caught: unknown;
    try {
      await s.scrape({ kind: 'url', url: 'https://www.youtube.com/playlist?list=PL1' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(ScrapeFetchError);
    expect((caught as ScrapeFetchError).detail).not.toContain(API_KEY);
  });
});

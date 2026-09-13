// coursera.scraper.spec.ts
import { describe, expect, it, vi } from 'vitest';

import { CourseraScraper } from './coursera.scraper';
import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';
import type { FetchResult, HttpFetcher } from './http-fetcher';

// Recorded 2026-09-13 against api.coursera.org (see docs/roadmap/tasks/E30-F02-S01.md).
const COURSE_URL = 'https://www.coursera.org/learn/machine-learning';

const courseFixture = JSON.stringify({
  elements: [
    {
      id: '0e3vE4KTEeWJlA6GkYzhbg',
      slug: 'machine-learning',
      name: 'Machine Learning',
      description: 'A broad introduction to machine learning.',
      photoUrl:
        'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/machine-learning.jpg',
      primaryLanguages: ['en'],
      startDate: 1_655_242_077_322,
      workload: '11 hours',
      instructorIds: ['1244'],
      partnerIds: ['475'],
    },
  ],
});

const instructorFixture = JSON.stringify({ elements: [{ id: '1244', fullName: 'Andrew Ng' }] });
const partnerFixture = JSON.stringify({ elements: [{ id: '475', name: 'DeepLearning.AI' }] });

/** Fetcher stub keyed by which Coursera resource the URL targets. */
function fetcherFor(responses: {
  course?: FetchResult;
  instructors?: FetchResult;
  partners?: FetchResult;
}): HttpFetcher {
  return {
    fetchText: vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.includes('/courses.v1'))
        return responses.course ?? { status: 200, headers: new Headers(), body: '{}' };
      if (url.includes('/instructors.v1'))
        return responses.instructors ?? { status: 200, headers: new Headers(), body: '{}' };
      if (url.includes('/partners.v1'))
        return responses.partners ?? { status: 200, headers: new Headers(), body: '{}' };
      throw new Error(`unexpected URL ${url}`);
    }),
  } as unknown as HttpFetcher;
}

describe('CourseraScraper', () => {
  it('matches coursera.org/learn/<slug> and rejects everything else', () => {
    const s = new CourseraScraper(fetcherFor({}));
    expect(s.id).toBe('coursera');
    expect(s.canHandle(COURSE_URL)).toBe(true);
    expect(s.canHandle('https://www.coursera.org/learn/machine-learning/home/welcome')).toBe(true);
    expect(s.canHandle('https://www.coursera.org/browse/data-science')).toBe(false);
    expect(s.canHandle('https://evil-coursera.org/learn/x')).toBe(false);
    expect(s.canHandle('https://example.com')).toBe(false);
  });

  it('fills all eight fragment fields on the happy path, batching both lookups', async () => {
    const fetcher = fetcherFor({
      course: { status: 200, headers: new Headers(), body: courseFixture },
      instructors: { status: 200, headers: new Headers(), body: instructorFixture },
      partners: { status: 200, headers: new Headers(), body: partnerFixture },
    });
    const s = new CourseraScraper(fetcher);
    const candidates = await s.scrape({ kind: 'url', url: COURSE_URL });

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.fragment).toEqual({
      title: 'Machine Learning',
      description: 'A broad introduction to machine learning.',
      posterUrl:
        'https://d3njjcbhbojbot.cloudfront.net/api/utilities/v1/imageproxy/machine-learning.jpg',
      language: 'en',
      releaseDate: '2022-06-14',
      instructorNames: ['Andrew Ng'],
      studioName: 'DeepLearning.AI',
      externalIds: [{ source: 'coursera', externalId: '0e3vE4KTEeWJlA6GkYzhbg', url: COURSE_URL }],
    });
    // exactly one call per resource — never one request per instructor/partner
    expect(fetcher.fetchText).toHaveBeenCalledTimes(3);
  });

  it('skips both lookups when the course carries no instructor/partner ids', async () => {
    const bareCourse = JSON.stringify({
      elements: [{ id: 'abc', name: 'Bare Course' }],
    });
    const fetcher = fetcherFor({
      course: { status: 200, headers: new Headers(), body: bareCourse },
    });
    const s = new CourseraScraper(fetcher);
    const candidates = await s.scrape({ kind: 'url', url: COURSE_URL });

    expect(candidates[0]?.fragment.instructorNames).toBeUndefined();
    expect(candidates[0]?.fragment.studioName).toBeUndefined();
    expect(fetcher.fetchText).toHaveBeenCalledTimes(1); // course only
  });

  it('degrades to a fragment without names when a lookup call fails', async () => {
    const fetcher = fetcherFor({
      course: { status: 200, headers: new Headers(), body: courseFixture },
      instructors: { status: 500, headers: new Headers(), body: '' },
      partners: { status: 200, headers: new Headers(), body: partnerFixture },
    });
    const s = new CourseraScraper(fetcher);
    const candidates = await s.scrape({ kind: 'url', url: COURSE_URL });

    expect(candidates[0]?.fragment.title).toBe('Machine Learning');
    expect(candidates[0]?.fragment.instructorNames).toBeUndefined();
    expect(candidates[0]?.fragment.studioName).toBe('DeepLearning.AI');
  });

  it('throws when the course call itself fails', async () => {
    const fetcher = fetcherFor({ course: { status: 500, headers: new Headers(), body: '' } });
    const s = new CourseraScraper(fetcher);
    await expect(s.scrape({ kind: 'url', url: COURSE_URL })).rejects.toBeInstanceOf(
      ScrapeFetchError,
    );
  });

  it('returns [] when the course lookup finds nothing', async () => {
    const fetcher = fetcherFor({ course: { status: 200, headers: new Headers(), body: '{}' } });
    const s = new CourseraScraper(fetcher);
    expect(await s.scrape({ kind: 'url', url: COURSE_URL })).toEqual([]);
  });

  it('converts startDate from epoch ms to an ISO date, and omits releaseDate when absent', async () => {
    const noDate = JSON.stringify({ elements: [{ id: 'x', name: 'No Date Course' }] });
    const fetcher = fetcherFor({ course: { status: 200, headers: new Headers(), body: noDate } });
    const s = new CourseraScraper(fetcher);
    const candidates = await s.scrape({ kind: 'url', url: COURSE_URL });
    expect(candidates[0]?.fragment.releaseDate).toBeUndefined();
  });

  it('ignores non-url invocation kinds', async () => {
    const s = new CourseraScraper(fetcherFor({}));
    expect(await s.scrape({ kind: 'name', query: 'machine learning' })).toEqual([]);
  });
});

// scrape-course.handler.spec.ts
import { describe, expect, it } from 'vitest';

import { CourseNotFoundError } from '../../domain/course/course.errors';
import {
  ScraperKindUnsupportedError,
  ScraperNotFoundError,
} from '../../domain/scraper/scraper.errors';
import { DefaultScraperRegistry } from '../../infra/scrapers/scraper.registry';
import { ScrapeCourseCommand } from './scrape-course.command';
import { ScrapeCourseHandler } from './scrape-course.handler';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { Scraper } from '../../domain/scraper/scraper.port';
import type { ScrapeCandidate, ScrapeRequest } from '../../domain/scraper/scraper.types';

const candidate: ScrapeCandidate = { source: 'json-ld', fragment: { title: 'Hello' } };

function scraper(id: string, kinds: string[], handles: (u: string) => boolean): Scraper {
  return {
    id,
    supportedKinds: kinds as Scraper['supportedKinds'],
    canHandle: handles,
    scrape: async (_req: ScrapeRequest) => [candidate],
  };
}

function repo(found: boolean): CourseRepository {
  return {
    findById: async () => (found ? ({ id: 'c1' } as never) : null),
  } as unknown as CourseRepository;
}

const youtube = scraper('youtube', ['url', 'name'], (u) => u.includes('youtube'));
const jsonLd = scraper('json-ld', ['url', 'fragment'], () => true);

function handler(found = true): ScrapeCourseHandler {
  return new ScrapeCourseHandler(repo(found), new DefaultScraperRegistry([youtube, jsonLd]));
}

describe('ScrapeCourseHandler', () => {
  it('throws CourseNotFoundError when the course does not exist', async () => {
    await expect(
      handler(false).execute(
        new ScrapeCourseCommand('missing', 'json-ld', { kind: 'fragment', raw: 'x' }),
      ),
    ).rejects.toBeInstanceOf(CourseNotFoundError);
  });

  it('auto-detects the scraper by URL when source is omitted', async () => {
    const out = await handler().execute(
      new ScrapeCourseCommand('c1', undefined, { kind: 'url', url: 'https://youtube.com/x' }),
    );
    expect(out).toEqual([candidate]);
  });

  it('falls back to json-ld for a fragment with no source', async () => {
    const out = await handler().execute(
      new ScrapeCourseCommand('c1', undefined, { kind: 'fragment', raw: '<html/>' }),
    );
    expect(out).toEqual([candidate]);
  });

  it('throws ScraperNotFoundError for an unknown source', async () => {
    await expect(
      handler().execute(new ScrapeCourseCommand('c1', 'bogus', { kind: 'url', url: 'https://x' })),
    ).rejects.toBeInstanceOf(ScraperNotFoundError);
  });

  it('throws ScraperNotFoundError for name-kind without an explicit source', async () => {
    await expect(
      handler().execute(new ScrapeCourseCommand('c1', undefined, { kind: 'name', query: 'rust' })),
    ).rejects.toBeInstanceOf(ScraperNotFoundError);
  });

  it('throws ScraperKindUnsupportedError when the scraper lacks the kind', async () => {
    await expect(
      handler().execute(new ScrapeCourseCommand('c1', 'json-ld', { kind: 'name', query: 'rust' })),
    ).rejects.toBeInstanceOf(ScraperKindUnsupportedError);
  });
});

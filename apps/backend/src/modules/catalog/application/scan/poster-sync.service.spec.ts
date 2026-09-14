/**
 * Unit tests for PosterSyncService (#496).
 *
 * Scenarios:
 *   1. Unchanged URL → no-op: setPosterUrl/setPosterStoragePath untouched, downloader not called.
 *   2. Cleared (undefined) from a set URL → both fields cleared, downloader not called.
 *   3. New URL, download succeeds → posterUrl set, posterStoragePath set to the returned path.
 *   4. New URL, download fails (resolves undefined) → posterUrl set, posterStoragePath cleared —
 *      the course still "saves" (caller decides, this service never throws).
 *   5. Changed URL (was already set to something else) → downloader is called with the new URL.
 */
import { describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { PosterSyncService } from './poster-sync.service';

import type { PosterDownloader } from '../../domain/course/poster-downloader.port';

function makeCourse(): Course {
  return Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function makeDownloader(result: string | undefined): PosterDownloader {
  return { download: vi.fn(async () => result) };
}

describe('PosterSyncService', () => {
  it('is a no-op when the URL is unchanged', async () => {
    const course = makeCourse();
    course.setPosterUrl('https://example.com/poster.jpg');
    course.setPosterStoragePath('/derived/lib-1/posters/course-1.jpg');
    const downloader = makeDownloader('/derived/lib-1/posters/course-1.jpg');
    const service = new PosterSyncService(downloader);

    await service.applyPosterUrl(course, 'https://example.com/poster.jpg');

    expect(downloader.download).not.toHaveBeenCalled();
    expect(course.posterStoragePath).toBe('/derived/lib-1/posters/course-1.jpg');
  });

  it('clears both fields when the next URL is undefined', async () => {
    const course = makeCourse();
    course.setPosterUrl('https://example.com/poster.jpg');
    course.setPosterStoragePath('/derived/lib-1/posters/course-1.jpg');
    const downloader = makeDownloader(undefined);
    const service = new PosterSyncService(downloader);

    await service.applyPosterUrl(course, undefined);

    expect(downloader.download).not.toHaveBeenCalled();
    expect(course.posterUrl).toBeUndefined();
    expect(course.posterStoragePath).toBeUndefined();
  });

  it('downloads and stores the path when a new URL succeeds', async () => {
    const course = makeCourse();
    const downloader = makeDownloader('/derived/lib-1/posters/course-1.jpg');
    const service = new PosterSyncService(downloader);

    await service.applyPosterUrl(course, 'https://example.com/poster.jpg');

    expect(downloader.download).toHaveBeenCalledWith({
      courseId: 'course-1',
      libraryId: 'lib-1',
      url: 'https://example.com/poster.jpg',
    });
    expect(course.posterUrl).toBe('https://example.com/poster.jpg');
    expect(course.posterStoragePath).toBe('/derived/lib-1/posters/course-1.jpg');
  });

  it('sets posterUrl but clears posterStoragePath when the download fails', async () => {
    const course = makeCourse();
    const downloader = makeDownloader(undefined);
    const service = new PosterSyncService(downloader);

    await service.applyPosterUrl(course, 'https://example.com/poster.jpg');

    expect(course.posterUrl).toBe('https://example.com/poster.jpg');
    expect(course.posterStoragePath).toBeUndefined();
  });

  it('re-downloads when the URL actually changes', async () => {
    const course = makeCourse();
    course.setPosterUrl('https://example.com/old.jpg');
    course.setPosterStoragePath('/derived/lib-1/posters/course-1.jpg');
    const downloader = makeDownloader('/derived/lib-1/posters/course-1-new.jpg');
    const service = new PosterSyncService(downloader);

    await service.applyPosterUrl(course, 'https://example.com/new.jpg');

    expect(downloader.download).toHaveBeenCalledWith({
      courseId: 'course-1',
      libraryId: 'lib-1',
      url: 'https://example.com/new.jpg',
    });
    expect(course.posterStoragePath).toBe('/derived/lib-1/posters/course-1-new.jpg');
  });
});

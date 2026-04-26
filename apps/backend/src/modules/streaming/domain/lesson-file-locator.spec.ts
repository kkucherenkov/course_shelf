/**
 * Unit tests for LessonFileLocator.
 *
 * All I/O dependencies are mocked:
 *   - LESSON_REPOSITORY → vi.fn() mock
 *   - COURSE_REPOSITORY → vi.fn() mock
 *   - LIBRARY_REPOSITORY → vi.fn() mock
 *   - fs.promises.stat   → vi.spyOn
 *
 * Scenarios — locate():
 *   1. Happy path — returns { absolutePath, sizeBytes, libraryId, courseId }.
 *   2. Missing lesson → LessonNotFoundError.
 *   3. Missing course (orphan lesson) → LessonNotFoundError.
 *   4. Missing library → LessonNotFoundError.
 *   5. Path traversal via relative videoPath (../../etc/passwd) → LessonFilePathEscapedError.
 *   6. Absolute videoPath that escapes the root (/etc/passwd) → LessonFilePathEscapedError.
 *   7. File absent on disk (stat throws) → LessonFileNotFoundError.
 *
 * Scenarios — locateSubtitle():
 *   8.  Happy path VTT — returns extension='.vtt'.
 *   9.  Happy path SRT — returns extension='.srt'.
 *   10. Language not found → SubtitleNotFoundError.
 *   11. Path traversal on subtitle path → LessonFilePathEscapedError.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LessonNotFoundError } from '../../../common/catalog-tokens';
import {
  LessonFileNotFoundError,
  LessonFilePathEscapedError,
  SubtitleNotFoundError,
} from './stream-token/stream-file.errors';
import { LessonFileLocator } from './lesson-file-locator';

import type {
  CourseRepository,
  LessonRepository,
  LibraryRepository,
} from '../../../common/catalog-tokens';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = '/srv/media';
const LESSON_ID = 'lesson-1';
const COURSE_ID = 'course-1';
const LIBRARY_ID = 'lib-1';
const VIDEO_RELATIVE = 'intro/lesson.mp4';
const EXPECTED_ABS = path.resolve(ROOT, VIDEO_RELATIVE);

const SUBTITLE_VTT_RELATIVE = 'intro/lesson.en.vtt';
const SUBTITLE_SRT_RELATIVE = 'intro/lesson.ru.srt';

function makeLessonWithSubtitles(subtitles: { language: string; path: string }[] = []): object {
  return {
    id: LESSON_ID,
    courseId: COURSE_ID,
    videoPath: VIDEO_RELATIVE,
    subtitles,
  };
}

function makeLessonRepo(overrides?: Partial<LessonRepository>): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue({
      id: LESSON_ID,
      courseId: COURSE_ID,
      videoPath: VIDEO_RELATIVE,
      subtitles: [],
    }),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    ...overrides,
  };
}

function makeCourseRepo(overrides?: Partial<CourseRepository>): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: COURSE_ID, libraryId: LIBRARY_ID }),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    ...overrides,
  };
}

function makeLibraryRepo(overrides?: Partial<LibraryRepository>): LibraryRepository {
  return {
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: LIBRARY_ID, rootPath: ROOT }),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    ...overrides,
  };
}

function makeLocator(
  lessonRepo: LessonRepository,
  courseRepo: CourseRepository,
  libraryRepo: LibraryRepository,
): LessonFileLocator {
  return new LessonFileLocator(lessonRepo, courseRepo, libraryRepo);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LessonFileLocator', () => {
  let statSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    statSpy = vi.spyOn(fs, 'stat');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  it('happy path — returns absolutePath, sizeBytes, libraryId, courseId', async () => {
    statSpy.mockResolvedValue({ size: 4096 } as Awaited<ReturnType<typeof fs.stat>>);

    const locator = makeLocator(makeLessonRepo(), makeCourseRepo(), makeLibraryRepo());
    const result = await locator.locate(LESSON_ID);

    expect(result.absolutePath).toBe(EXPECTED_ABS);
    expect(result.sizeBytes).toBe(4096);
    expect(result.libraryId).toBe(LIBRARY_ID);
    expect(result.courseId).toBe(COURSE_ID);
  });

  // -------------------------------------------------------------------------
  it('throws LessonNotFoundError when lesson is absent', async () => {
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(null) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonNotFoundError);
  });

  // -------------------------------------------------------------------------
  it('throws LessonNotFoundError when parent course is absent (orphan lesson)', async () => {
    const locator = makeLocator(
      makeLessonRepo(),
      makeCourseRepo({ findById: vi.fn().mockResolvedValue(null) }),
      makeLibraryRepo(),
    );

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonNotFoundError);
  });

  // -------------------------------------------------------------------------
  it('throws LessonNotFoundError when library is absent', async () => {
    const locator = makeLocator(
      makeLessonRepo(),
      makeCourseRepo(),
      makeLibraryRepo({ findById: vi.fn().mockResolvedValue(null) }),
    );

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonNotFoundError);
  });

  // -------------------------------------------------------------------------
  it('throws LessonFilePathEscapedError for traversal via relative videoPath (../../etc/passwd)', async () => {
    const traversalLesson = { id: LESSON_ID, courseId: COURSE_ID, videoPath: '../../etc/passwd' };
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(traversalLesson) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonFilePathEscapedError);
  });

  // -------------------------------------------------------------------------
  it('throws LessonFilePathEscapedError for absolute videoPath that escapes root (/etc/passwd)', async () => {
    const escapedLesson = { id: LESSON_ID, courseId: COURSE_ID, videoPath: '/etc/passwd' };
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(escapedLesson) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonFilePathEscapedError);
  });

  // -------------------------------------------------------------------------
  it('throws LessonFileNotFoundError when file is absent on disk', async () => {
    statSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    const locator = makeLocator(makeLessonRepo(), makeCourseRepo(), makeLibraryRepo());

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonFileNotFoundError);
  });

  // ---------------------------------------------------------------------------
  // locateSubtitle
  // ---------------------------------------------------------------------------

  it('locateSubtitle happy path — VTT returns extension .vtt', async () => {
    const lessonWithVtt = makeLessonWithSubtitles([
      { language: 'en', path: SUBTITLE_VTT_RELATIVE },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithVtt) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    const result = await locator.locateSubtitle(LESSON_ID, 'en');

    expect(result.extension).toBe('.vtt');
    expect(result.absolutePath).toBe(path.resolve(ROOT, SUBTITLE_VTT_RELATIVE));
    expect(result.courseId).toBe(COURSE_ID);
    expect(result.libraryId).toBe(LIBRARY_ID);
  });

  it('locateSubtitle happy path — SRT returns extension .srt', async () => {
    const lessonWithSrt = makeLessonWithSubtitles([
      { language: 'ru', path: SUBTITLE_SRT_RELATIVE },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithSrt) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    const result = await locator.locateSubtitle(LESSON_ID, 'ru');

    expect(result.extension).toBe('.srt');
    expect(result.absolutePath).toBe(path.resolve(ROOT, SUBTITLE_SRT_RELATIVE));
  });

  it('locateSubtitle — language lookup is case-insensitive', async () => {
    const lessonWithVtt = makeLessonWithSubtitles([
      { language: 'EN', path: SUBTITLE_VTT_RELATIVE },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithVtt) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    const result = await locator.locateSubtitle(LESSON_ID, 'en');
    expect(result.extension).toBe('.vtt');
  });

  it('locateSubtitle throws SubtitleNotFoundError when language is missing', async () => {
    const lessonNoSubtitles = makeLessonWithSubtitles([]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonNoSubtitles) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locateSubtitle(LESSON_ID, 'fr')).rejects.toBeInstanceOf(
      SubtitleNotFoundError,
    );
  });

  it('locateSubtitle throws LessonFilePathEscapedError for traversal on subtitle path', async () => {
    const lessonWithEvilSubtitle = makeLessonWithSubtitles([
      { language: 'en', path: '../../etc/passwd' },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithEvilSubtitle) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locateSubtitle(LESSON_ID, 'en')).rejects.toBeInstanceOf(
      LessonFilePathEscapedError,
    );
  });
});

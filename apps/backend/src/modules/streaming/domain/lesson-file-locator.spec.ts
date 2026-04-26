/**
 * Unit tests for LessonFileLocator.
 *
 * All I/O dependencies are mocked:
 *   - LESSON_REPOSITORY → vi.fn() mock
 *   - COURSE_REPOSITORY → vi.fn() mock
 *   - LIBRARY_REPOSITORY → vi.fn() mock
 *   - fs.promises.stat   → vi.spyOn
 *
 * Scenarios:
 *   1. Happy path — returns { absolutePath, sizeBytes, libraryId, courseId }.
 *   2. Missing lesson → LessonNotFoundError.
 *   3. Missing course (orphan lesson) → LessonNotFoundError.
 *   4. Missing library → LessonNotFoundError.
 *   5. Path traversal via relative videoPath (../../etc/passwd) → LessonFilePathEscapedError.
 *   6. Absolute videoPath that escapes the root (/etc/passwd) → LessonFilePathEscapedError.
 *   7. File absent on disk (stat throws) → LessonFileNotFoundError.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LessonNotFoundError } from '../../../common/catalog-tokens';
import {
  LessonFileNotFoundError,
  LessonFilePathEscapedError,
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

function makeLessonRepo(overrides?: Partial<LessonRepository>): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi
      .fn()
      .mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID, videoPath: VIDEO_RELATIVE }),
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
    ...overrides,
  };
}

function makeLibraryRepo(overrides?: Partial<LibraryRepository>): LibraryRepository {
  return {
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: LIBRARY_ID, rootPath: ROOT }),
    findAll: vi.fn(),
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
});

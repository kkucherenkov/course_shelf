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
 *
 * Scenarios — locateMaterial():
 *   12. Happy path — returns absolutePath, sizeBytes, label, kind, courseId, libraryId.
 *   13. Material id not found on lesson → MaterialNotFoundError.
 *   14. Path traversal on material path → LessonFilePathEscapedError.
 *   15. File absent on disk → MaterialFileNotFoundError.
 *   16. Missing lesson → LessonNotFoundError.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DerivedPathEscapedError, LessonNotFoundError } from '../../../common/catalog-tokens';
import {
  LessonFileNotFoundError,
  LessonFilePathEscapedError,
  MaterialFileNotFoundError,
  MaterialNotFoundError,
  SubtitleNotFoundError,
} from './stream-token/stream-file.errors';
import { LessonFileLocator } from './lesson-file-locator';

import type { AppConfig } from '../../../common/config/app-config';
import type {
  CourseRepository,
  LessonRepository,
  LibraryRepository,
  TranscriptRepository,
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

const MATERIAL_ID = 'mat-1';
const MATERIAL_RELATIVE = 'intro/notes.pdf';
const EXPECTED_MATERIAL_ABS = path.resolve(ROOT, MATERIAL_RELATIVE);

function makeLessonWithSubtitles(subtitles: { language: string; path: string }[] = []): object {
  return {
    id: LESSON_ID,
    courseId: COURSE_ID,
    videoPath: VIDEO_RELATIVE,
    subtitles,
    materials: [],
  };
}

function makeLessonWithMaterials(
  materials: { id: string; path: string; kind: string; label: string; sizeBytes: number }[] = [],
): object {
  return {
    id: LESSON_ID,
    courseId: COURSE_ID,
    videoPath: VIDEO_RELATIVE,
    subtitles: [],
    materials,
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
      materials: [],
    }),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
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
    findRecentlyAdded: vi.fn(),
    ...overrides,
  };
}

function makeLibraryRepo(overrides?: Partial<LibraryRepository>): LibraryRepository {
  return {
    save: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: LIBRARY_ID, rootPath: ROOT }),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    update: vi.fn(),
    findByRootPath: vi.fn(),
    removeWithCascade: vi.fn(),
    ...overrides,
  };
}

function makeTranscriptRepo(overrides?: Partial<TranscriptRepository>): TranscriptRepository {
  return {
    findGeneratedForLessons: vi.fn().mockResolvedValue(new Map()),
    replaceGenerated: vi.fn(),
    findExisting: vi.fn().mockResolvedValue(null),
    replaceSidecar: vi.fn(),
    deleteForLesson: vi.fn(),
    ...overrides,
  };
}

function makeAppConfig(derivedPath = '/srv/derived'): AppConfig {
  return { derivedPath } as unknown as AppConfig;
}

function makeLocator(
  lessonRepo: LessonRepository,
  courseRepo: CourseRepository,
  libraryRepo: LibraryRepository,
  transcriptRepo: TranscriptRepository = makeTranscriptRepo(),
  appConfig: AppConfig = makeAppConfig(),
): LessonFileLocator {
  return new LessonFileLocator(lessonRepo, courseRepo, libraryRepo, transcriptRepo, appConfig);
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
    const traversalLesson = {
      id: LESSON_ID,
      courseId: COURSE_ID,
      videoPath: '../../etc/passwd',
      subtitles: [],
      materials: [],
    };
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(traversalLesson) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locate(LESSON_ID)).rejects.toBeInstanceOf(LessonFilePathEscapedError);
  });

  // -------------------------------------------------------------------------
  it('throws LessonFilePathEscapedError for absolute videoPath that escapes root (/etc/passwd)', async () => {
    const escapedLesson = {
      id: LESSON_ID,
      courseId: COURSE_ID,
      videoPath: '/etc/passwd',
      subtitles: [],
      materials: [],
    };
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

  it('locateSubtitle throws SubtitleNotFoundError when language is missing and no generated transcript exists', async () => {
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

  it('locateSubtitle falls back to a generated transcript when no sidecar matches the language', async () => {
    const lessonNoSubtitles = makeLessonWithSubtitles([]);
    const transcriptRepo = makeTranscriptRepo({
      findGeneratedForLessons: vi
        .fn()
        .mockResolvedValue(new Map([[LESSON_ID, { sourceMtime: new Date(), sourceSize: 1 }]])),
    });
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonNoSubtitles) }),
      makeCourseRepo(),
      makeLibraryRepo(),
      transcriptRepo,
      makeAppConfig('/srv/derived'),
    );

    const result = await locator.locateSubtitle(LESSON_ID, 'fr');

    expect(result.extension).toBe('.srt');
    expect(result.absolutePath).toBe(
      path.resolve('/srv/derived', LIBRARY_ID, `${VIDEO_RELATIVE}.fr.srt`),
    );
    expect(transcriptRepo.findGeneratedForLessons).toHaveBeenCalledWith([LESSON_ID], 'fr');
  });

  it('locateSubtitle prefers a sidecar over a generated transcript in the same language', async () => {
    const lessonWithVtt = makeLessonWithSubtitles([
      { language: 'en', path: SUBTITLE_VTT_RELATIVE },
    ]);
    const transcriptRepo = makeTranscriptRepo();
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithVtt) }),
      makeCourseRepo(),
      makeLibraryRepo(),
      transcriptRepo,
    );

    const result = await locator.locateSubtitle(LESSON_ID, 'en');

    expect(result.absolutePath).toBe(path.resolve(ROOT, SUBTITLE_VTT_RELATIVE));
    expect(transcriptRepo.findGeneratedForLessons).not.toHaveBeenCalled();
  });

  it('locateSubtitle throws DerivedPathEscapedError when the generated path would escape the derived root', async () => {
    const traversalLesson = {
      id: LESSON_ID,
      courseId: COURSE_ID,
      videoPath: '../../etc/passwd',
      subtitles: [],
      materials: [],
    };
    const transcriptRepo = makeTranscriptRepo({
      findGeneratedForLessons: vi
        .fn()
        .mockResolvedValue(new Map([[LESSON_ID, { sourceMtime: new Date(), sourceSize: 1 }]])),
    });
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(traversalLesson) }),
      makeCourseRepo(),
      makeLibraryRepo(),
      transcriptRepo,
    );

    await expect(locator.locateSubtitle(LESSON_ID, 'fr')).rejects.toBeInstanceOf(
      DerivedPathEscapedError,
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

  // ---------------------------------------------------------------------------
  // locateMaterial
  // ---------------------------------------------------------------------------

  it('locateMaterial happy path — returns absolutePath, sizeBytes, label, kind', async () => {
    statSpy.mockResolvedValue({ size: 8192 } as Awaited<ReturnType<typeof fs.stat>>);

    const lessonWithMaterial = makeLessonWithMaterials([
      { id: MATERIAL_ID, path: MATERIAL_RELATIVE, kind: 'doc', label: 'Notes', sizeBytes: 8192 },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithMaterial) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    const result = await locator.locateMaterial(LESSON_ID, MATERIAL_ID);

    expect(result.absolutePath).toBe(EXPECTED_MATERIAL_ABS);
    expect(result.sizeBytes).toBe(8192);
    expect(result.label).toBe('Notes');
    expect(result.kind).toBe('doc');
    expect(result.courseId).toBe(COURSE_ID);
    expect(result.libraryId).toBe(LIBRARY_ID);
  });

  it('locateMaterial throws MaterialNotFoundError when material id is absent', async () => {
    const lessonNoMaterials = makeLessonWithMaterials([]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonNoMaterials) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locateMaterial(LESSON_ID, 'mat-missing')).rejects.toBeInstanceOf(
      MaterialNotFoundError,
    );
  });

  it('locateMaterial throws LessonFilePathEscapedError for traversal on material path', async () => {
    const lessonWithEvilMaterial = makeLessonWithMaterials([
      {
        id: MATERIAL_ID,
        path: '../../etc/passwd',
        kind: 'doc',
        label: 'Evil',
        sizeBytes: 1,
      },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithEvilMaterial) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locateMaterial(LESSON_ID, MATERIAL_ID)).rejects.toBeInstanceOf(
      LessonFilePathEscapedError,
    );
  });

  it('locateMaterial throws MaterialFileNotFoundError when file is absent on disk', async () => {
    statSpy.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    const lessonWithMaterial = makeLessonWithMaterials([
      { id: MATERIAL_ID, path: MATERIAL_RELATIVE, kind: 'doc', label: 'Notes', sizeBytes: 100 },
    ]);
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(lessonWithMaterial) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locateMaterial(LESSON_ID, MATERIAL_ID)).rejects.toBeInstanceOf(
      MaterialFileNotFoundError,
    );
  });

  it('locateMaterial throws LessonNotFoundError when lesson is absent', async () => {
    const locator = makeLocator(
      makeLessonRepo({ findById: vi.fn().mockResolvedValue(null) }),
      makeCourseRepo(),
      makeLibraryRepo(),
    );

    await expect(locator.locateMaterial('missing-lesson', MATERIAL_ID)).rejects.toBeInstanceOf(
      LessonNotFoundError,
    );
  });
});

/**
 * WHY this file exists:
 * Domain service that resolves a lessonId to an absolute filesystem path for
 * streaming. It is the single place that knows how `lesson.videoPath` +
 * `library.rootPath` combine, and the single place that enforces the
 * traversal-protection invariant.
 *
 * Steps (locate):
 *   1. Load lesson by id → 404 if absent.
 *   2. Load parent course → defensive 404 if absent (data inconsistency).
 *   3. Load library by course.libraryId → defensive 404 if absent.
 *   4. Resolve absolute path: path.resolve(library.rootPath, lesson.videoPath).
 *   5. Traversal check: assert the resolved path does not escape the library root.
 *      If it does → LessonFilePathEscapedError (500) — fail closed.
 *   6. Stat the file → LessonFileNotFoundError (404) if absent.
 *   7. Return { absolutePath, sizeBytes, libraryId, courseId }.
 *
 * locateSubtitle adds a parallel path for subtitle files:
 *   - Same lesson/course/library load + traversal guard.
 *   - Finds the first Subtitle on the lesson whose language matches (case-insensitive).
 *   - Returns { absolutePath, extension, courseId, libraryId }.
 *   - Missing language or unrecognised extension → SubtitleNotFoundError (404).
 *
 * locateMaterial adds a parallel path for material sidecar files (PDF / MD / image):
 *   - Same lesson/course/library load + traversal guard.
 *   - Finds the material on lesson.materials by id → MaterialNotFoundError (404).
 *   - Resolves path.resolve(library.rootPath, material.path) + traversal guard.
 *   - Stats the file → MaterialFileNotFoundError (404) if absent.
 *   - Returns { absolutePath, sizeBytes, label, kind, courseId, libraryId }.
 *
 * Symlink handling (v1): we trust that the library.rootPath and videoPath are
 * not symlinks pointing outside the root. path.relative-based traversal check
 * is sufficient for the common case (NFS / bind mounts stay under the root).
 * TODO (v2): add fs.realpath canonicalization to harden against symlinks.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Inject, Injectable } from '@nestjs/common';

import {
  COURSE_REPOSITORY,
  LESSON_REPOSITORY,
  LIBRARY_REPOSITORY,
  LessonNotFoundError,
} from '../../../common/catalog-tokens';
import {
  LessonFileNotFoundError,
  LessonFilePathEscapedError,
  MaterialFileNotFoundError,
  MaterialNotFoundError,
  SubtitleNotFoundError,
} from './stream-token/stream-file.errors';

import type {
  CourseRepository,
  LessonRepository,
  LibraryRepository,
  MaterialKindValue,
} from '../../../common/catalog-tokens';

export interface LocatedFile {
  readonly absolutePath: string;
  readonly sizeBytes: number;
  readonly libraryId: string;
  readonly courseId: string;
}

export interface LocatedSubtitle {
  readonly absolutePath: string;
  readonly extension: '.srt' | '.vtt';
  readonly courseId: string;
  readonly libraryId: string;
}

export interface LocatedMaterial {
  readonly absolutePath: string;
  readonly sizeBytes: number;
  readonly label: string;
  readonly kind: MaterialKindValue;
  readonly courseId: string;
  readonly libraryId: string;
}

@Injectable()
export class LessonFileLocator {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
  ) {}

  async locate(lessonId: string): Promise<LocatedFile> {
    const { lesson, course, library } = await this.loadLessonContext(lessonId);

    // 4. Compute absolute path from rootPath + relative videoPath.
    const canonicalRoot = path.resolve(library.rootPath);
    const absolutePath = path.resolve(library.rootPath, lesson.videoPath);

    // 5. Traversal check: relative path must not start with '..'.
    const rel = path.relative(canonicalRoot, absolutePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new LessonFilePathEscapedError(lessonId);
    }

    // 6. Stat the file.
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(absolutePath);
    } catch {
      throw new LessonFileNotFoundError(lessonId);
    }

    return {
      absolutePath,
      sizeBytes: stat.size,
      libraryId: course.libraryId,
      courseId: lesson.courseId,
    };
  }

  /**
   * Resolve the absolute path of a subtitle track identified by lessonId + language.
   *
   * - Loads lesson / course / library (same path as locate()).
   * - Finds the first Subtitle whose `language` matches (case-insensitive).
   * - Applies the traversal-protection guard to the subtitle path.
   * - Returns { absolutePath, extension, courseId, libraryId }.
   *
   * Throws:
   *   SubtitleNotFoundError — no matching language, or extension not .srt/.vtt.
   *   LessonNotFoundError   — lesson/course/library missing.
   *   LessonFilePathEscapedError — path escapes library root (500, fail-closed).
   */
  async locateSubtitle(lessonId: string, language: string): Promise<LocatedSubtitle> {
    const { lesson, course, library } = await this.loadLessonContext(lessonId);

    const langLower = language.toLowerCase();
    const subtitle = lesson.subtitles.find((s) => s.language.toLowerCase() === langLower);
    if (!subtitle) {
      throw new SubtitleNotFoundError(lessonId, language);
    }

    // Resolve and guard the subtitle path the same way as the video path.
    const canonicalRoot = path.resolve(library.rootPath);
    const absolutePath = path.resolve(library.rootPath, subtitle.path);

    const rel = path.relative(canonicalRoot, absolutePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new LessonFilePathEscapedError(lessonId);
    }

    // Only .srt and .vtt are valid subtitle extensions. Anything else means
    // the subtitle record is corrupt — treat as not-found (defensive).
    const rawExt = path.extname(absolutePath).toLowerCase();
    if (rawExt !== '.srt' && rawExt !== '.vtt') {
      throw new SubtitleNotFoundError(lessonId, language);
    }
    // At this point rawExt is narrowed to '.srt' | '.vtt' by the guard above.
    const extension = rawExt;

    return {
      absolutePath,
      extension,
      courseId: lesson.courseId,
      libraryId: course.libraryId,
    };
  }

  /**
   * Resolve the absolute path of a material sidecar file.
   *
   * - Loads lesson / course / library (same path as locate()).
   * - Finds the material by id on lesson.materials → MaterialNotFoundError (404).
   * - Applies the traversal-protection guard to the material path.
   * - Stats the file → MaterialFileNotFoundError (404) if absent.
   * - Returns { absolutePath, sizeBytes, label, kind, courseId, libraryId }.
   *
   * Throws:
   *   MaterialNotFoundError     — no material with given id on this lesson.
   *   LessonNotFoundError       — lesson/course/library missing.
   *   LessonFilePathEscapedError — path escapes library root (500, fail-closed).
   *   MaterialFileNotFoundError — material row exists but file absent on disk.
   */
  async locateMaterial(lessonId: string, materialId: string): Promise<LocatedMaterial> {
    const { lesson, course, library } = await this.loadLessonContext(lessonId);

    const material = lesson.materials.find((m) => m.id === materialId);
    if (!material) {
      throw new MaterialNotFoundError(lessonId, materialId);
    }

    // Resolve absolute path and apply the same traversal guard as the video path.
    const canonicalRoot = path.resolve(library.rootPath);
    const absolutePath = path.resolve(library.rootPath, material.path);

    const rel = path.relative(canonicalRoot, absolutePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new LessonFilePathEscapedError(lessonId);
    }

    // Stat to confirm the file exists and to get its current size.
    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(absolutePath);
    } catch {
      throw new MaterialFileNotFoundError(materialId);
    }

    return {
      absolutePath,
      sizeBytes: stat.size,
      label: material.label,
      kind: material.kind,
      courseId: lesson.courseId,
      libraryId: course.libraryId,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Load and validate the lesson → course → library chain.
   * Throws LessonNotFoundError if any link is missing.
   */
  private async loadLessonContext(lessonId: string): Promise<{
    lesson: Awaited<ReturnType<LessonRepository['findById']>> & NonNullable<unknown>;
    course: Awaited<ReturnType<CourseRepository['findById']>> & NonNullable<unknown>;
    library: Awaited<ReturnType<LibraryRepository['findById']>> & NonNullable<unknown>;
  }> {
    // 1. Load lesson.
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    // 2. Load parent course (needed for libraryId).
    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      // Defensive — orphan lesson means our own data is inconsistent.
      throw new LessonNotFoundError(lessonId);
    }

    // 3. Load library (needed for rootPath).
    const library = await this.libraryRepo.findById(course.libraryId);
    if (!library) {
      // Defensive — library deleted after course was created.
      throw new LessonNotFoundError(lessonId);
    }

    return { lesson, course, library };
  }
}

/**
 * WHY this file exists:
 * Domain service that resolves a lessonId to an absolute filesystem path for
 * streaming. It is the single place that knows how `lesson.videoPath` +
 * `library.rootPath` combine, and the single place that enforces the
 * traversal-protection invariant.
 *
 * Steps:
 *   1. Load lesson by id → 404 if absent.
 *   2. Load parent course → defensive 404 if absent (data inconsistency).
 *   3. Load library by course.libraryId → defensive 404 if absent.
 *   4. Resolve absolute path: path.resolve(library.rootPath, lesson.videoPath).
 *   5. Traversal check: assert the resolved path does not escape the library root.
 *      If it does → LessonFilePathEscapedError (500) — fail closed.
 *   6. Stat the file → LessonFileNotFoundError (404) if absent.
 *   7. Return { absolutePath, sizeBytes, libraryId, courseId }.
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
} from './stream-token/stream-file.errors';

import type {
  CourseRepository,
  LessonRepository,
  LibraryRepository,
} from '../../../common/catalog-tokens';

export interface LocatedFile {
  readonly absolutePath: string;
  readonly sizeBytes: number;
  readonly libraryId: string;
  readonly courseId: string;
}

@Injectable()
export class LessonFileLocator {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
  ) {}

  async locate(lessonId: string): Promise<LocatedFile> {
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
}

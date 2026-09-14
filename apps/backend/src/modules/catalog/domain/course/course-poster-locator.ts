/**
 * WHY this file exists:
 * Domain service that resolves a courseId to the absolute path of its stored
 * poster for GET /courses/:id/poster (#496). Mirrors streaming's
 * LessonFileLocator in shape (load → stat → 404) but stays inside catalog:
 * `Course.posterStoragePath` is stored as an already-resolved absolute path
 * (see HttpPosterDownloader), so there is no library-relative path to
 * recompute here — only a defensive re-check that it still lands under
 * DERIVED_PATH, in case a stale/tampered row ever pointed elsewhere.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Inject, Injectable } from '@nestjs/common';

import { AppConfig } from '../../../../common/config/app-config';
import { COURSE_REPOSITORY } from './course.repository';
import { CourseNotFoundError, CoursePosterNotFoundError } from './course.errors';

import type { CourseRepository } from './course.repository';

export interface LocatedPoster {
  readonly absolutePath: string;
  readonly sizeBytes: number;
}

@Injectable()
export class CoursePosterLocator {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    private readonly appConfig: AppConfig,
  ) {}

  async locate(courseId: string): Promise<LocatedPoster> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }
    if (!course.posterStoragePath) {
      throw new CoursePosterNotFoundError(courseId);
    }

    // Defensive re-check — the column is written only by HttpPosterDownloader,
    // but a future writer must not be able to point this route outside the
    // derived root.
    const derivedRoot = path.resolve(this.appConfig.derivedPath);
    const rel = path.relative(derivedRoot, course.posterStoragePath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new CoursePosterNotFoundError(courseId);
    }

    let stat: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stat = await fs.stat(course.posterStoragePath);
    } catch {
      throw new CoursePosterNotFoundError(courseId);
    }

    return { absolutePath: course.posterStoragePath, sizeBytes: stat.size };
  }
}

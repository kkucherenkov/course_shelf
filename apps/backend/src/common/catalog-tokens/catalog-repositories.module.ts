/**
 * WHY this file exists:
 * CatalogModule does not export its repository providers (by design — it wants
 * to keep adapters internal). StreamingModule needs LESSON_REPOSITORY and
 * COURSE_REPOSITORY at runtime but cannot import from `src/modules/catalog/**`
 * directly (boundaries/element-types rejects cross-context imports).
 *
 * Solution: this thin NestJS Module lives in `src/common/` (which is in the
 * `allow` zone for all module types) and provides the two Prisma adapters
 * behind the catalog domain tokens. StreamingModule imports this module and
 * gets the providers via Nest DI — no direct source-file import from catalog.
 *
 * The Symbol identity of LESSON_REPOSITORY and COURSE_REPOSITORY is preserved
 * (re-exported from this package via index.ts, not re-created).
 *
 * PrismaModule must be importable by the consumer (it is global in the app).
 */
import { Module } from '@nestjs/common';

import { PrismaCourseRepository } from '../../modules/catalog/infra/prisma-course.repository';
import { PrismaLessonRepository } from '../../modules/catalog/infra/prisma-lesson.repository';
import { PrismaLibraryRepository } from '../../modules/catalog/infra/prisma-library.repository';
import { COURSE_REPOSITORY } from '../../modules/catalog/domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../modules/catalog/domain/lesson/lesson.repository';
import { LIBRARY_REPOSITORY } from '../../modules/catalog/domain/library/library.repository';

// LIBRARY_REPOSITORY added for E08-F02-S01: LessonFileLocator resolves
// lesson.videoPath against library.rootPath to obtain the absolute video path.
@Module({
  providers: [
    { provide: LESSON_REPOSITORY, useClass: PrismaLessonRepository },
    { provide: COURSE_REPOSITORY, useClass: PrismaCourseRepository },
    { provide: LIBRARY_REPOSITORY, useClass: PrismaLibraryRepository },
  ],
  exports: [LESSON_REPOSITORY, COURSE_REPOSITORY, LIBRARY_REPOSITORY],
})
export class CatalogRepositoriesModule {}

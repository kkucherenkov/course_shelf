/**
 * WHY this file exists:
 * Composition root for the Learning bounded context.
 * Wires together:
 *   - ProgressController — POST /progress, GET /progress/:lessonId
 *   - BookmarksController — GET/POST lessons/:lessonId/bookmarks,
 *                           PATCH/DELETE bookmarks/:id
 *   - RecordProgressHandler (application command)
 *   - GetLessonProgressHandler (application query)
 *   - ListBookmarksHandler, CreateBookmarkHandler, UpdateBookmarkHandler,
 *     DeleteBookmarkHandler (E09-F02-S01)
 *   - PrismaLessonProgressRepository bound behind LESSON_PROGRESS_REPOSITORY
 *   - PrismaBookmarkRepository bound behind BOOKMARK_REPOSITORY
 *   - CatalogRepositoriesModule — provides LESSON_REPOSITORY + COURSE_REPOSITORY
 *   - CommonAccessModule — provides AUTHORIZATION_SERVICE
 *
 * Dependency-boundary note:
 *   This module MUST NOT import anything from src/modules/catalog/** directly.
 *   All catalog dependencies flow through src/common/catalog-tokens/ (in the
 *   `allow` zone for all bounded contexts per packages/eslint-config/nest.mjs).
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CommonAccessModule } from '../../common/access/access.module';
import { CatalogRepositoriesModule } from '../../common/catalog-tokens/catalog-repositories.module';
import { CreateBookmarkHandler } from './application/commands/create-bookmark.handler';
import { DeleteBookmarkHandler } from './application/commands/delete-bookmark.handler';
import { RecordProgressHandler } from './application/commands/record-progress.handler';
import { UpdateBookmarkHandler } from './application/commands/update-bookmark.handler';
import { GetLessonProgressHandler } from './application/queries/get-lesson-progress.handler';
import { ListBookmarksHandler } from './application/queries/list-bookmarks.handler';
import { BOOKMARK_REPOSITORY } from './domain/bookmark/bookmark.repository';
import { LESSON_PROGRESS_REPOSITORY } from './domain/progress/lesson-progress.repository';
import { PrismaBookmarkRepository } from './infra/prisma-bookmark.repository';
import { PrismaLessonProgressRepository } from './infra/prisma-lesson-progress.repository';
import { BookmarksController } from './bookmarks.controller';
import { ProgressController } from './progress.controller';

@Module({
  imports: [CqrsModule, CommonAccessModule, CatalogRepositoriesModule],
  controllers: [ProgressController, BookmarksController],
  providers: [
    RecordProgressHandler,
    GetLessonProgressHandler,
    ListBookmarksHandler,
    CreateBookmarkHandler,
    UpdateBookmarkHandler,
    DeleteBookmarkHandler,
    { provide: LESSON_PROGRESS_REPOSITORY, useClass: PrismaLessonProgressRepository },
    { provide: BOOKMARK_REPOSITORY, useClass: PrismaBookmarkRepository },
  ],
})
export class LearningModule {}

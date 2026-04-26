/**
 * WHY this file exists:
 * Composition root for the Learning bounded context.
 * Wires together:
 *   - ProgressController — POST /progress, GET /progress/:lessonId
 *   - BookmarksController — GET/POST lessons/:lessonId/bookmarks,
 *                           PATCH/DELETE bookmarks/:id
 *   - NotesController — PUT /notes, GET /notes/:lessonId,
 *                       DELETE /notes/:lessonId (E09-F02-S02)
 *   - RecordProgressHandler (application command)
 *   - GetLessonProgressHandler (application query)
 *   - ListBookmarksHandler, CreateBookmarkHandler, UpdateBookmarkHandler,
 *     DeleteBookmarkHandler (E09-F02-S01)
 *   - UpsertNoteHandler, DeleteNoteHandler (application commands, E09-F02-S02)
 *   - GetNoteHandler (application query, E09-F02-S02)
 *   - PrismaLessonProgressRepository bound behind LESSON_PROGRESS_REPOSITORY
 *   - PrismaBookmarkRepository bound behind BOOKMARK_REPOSITORY
 *   - PrismaNoteRepository bound behind NOTE_REPOSITORY
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
import { DeleteNoteHandler } from './application/commands/delete-note.handler';
import { RecordProgressBatchHandler } from './application/commands/record-progress-batch.handler';
import { RecordProgressHandler } from './application/commands/record-progress.handler';
import { UpdateBookmarkHandler } from './application/commands/update-bookmark.handler';
import { UpsertNoteHandler } from './application/commands/upsert-note.handler';
import { GetLessonProgressHandler } from './application/queries/get-lesson-progress.handler';
import { GetNoteHandler } from './application/queries/get-note.handler';
import { ListBookmarksHandler } from './application/queries/list-bookmarks.handler';
import { BOOKMARK_REPOSITORY } from './domain/bookmark/bookmark.repository';
import { NOTE_REPOSITORY } from './domain/note/note.repository';
import { LESSON_PROGRESS_REPOSITORY } from './domain/progress/lesson-progress.repository';
import { PrismaBookmarkRepository } from './infra/prisma-bookmark.repository';
import { PrismaNoteRepository } from './infra/prisma-note.repository';
import { PrismaLessonProgressRepository } from './infra/prisma-lesson-progress.repository';
import { BookmarksController } from './bookmarks.controller';
import { NotesController } from './notes.controller';
import { ProgressController } from './progress.controller';

@Module({
  imports: [CqrsModule, CommonAccessModule, CatalogRepositoriesModule],
  controllers: [ProgressController, BookmarksController, NotesController],
  providers: [
    RecordProgressHandler,
    RecordProgressBatchHandler,
    GetLessonProgressHandler,
    ListBookmarksHandler,
    CreateBookmarkHandler,
    UpdateBookmarkHandler,
    DeleteBookmarkHandler,
    UpsertNoteHandler,
    DeleteNoteHandler,
    GetNoteHandler,
    { provide: LESSON_PROGRESS_REPOSITORY, useClass: PrismaLessonProgressRepository },
    { provide: BOOKMARK_REPOSITORY, useClass: PrismaBookmarkRepository },
    { provide: NOTE_REPOSITORY, useClass: PrismaNoteRepository },
  ],
})
export class LearningModule {}

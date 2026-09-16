/**
 * WHY this file exists:
 * Composition root for the Learning bounded context.
 * Wires together:
 *   - ProgressController — POST /progress, GET /progress/:lessonId
 *   - BookmarksController — GET/POST lessons/:lessonId/bookmarks,
 *                           PATCH/DELETE bookmarks/:id
 *   - NotesController — PUT /notes, GET /notes/:lessonId,
 *                       DELETE /notes/:lessonId (E09-F02-S02)
 *   - GenerateLessonQuizController — POST lessons/:id/quizzes (E29-F02-S01)
 *   - GenerateCourseQuizController — POST courses/:id/quizzes (E29-F02-S01)
 *   - QuizzesController — GET quizzes(?status=&lessonId=&courseId=),
 *     GET quizzes/:id, POST quizzes/:id/apply|discard (E29-F02-S01)
 *   - RecordProgressHandler (application command)
 *   - GetLessonProgressHandler (application query)
 *   - ListBookmarksHandler, CreateBookmarkHandler, UpdateBookmarkHandler,
 *     DeleteBookmarkHandler (E09-F02-S01)
 *   - UpsertNoteHandler, DeleteNoteHandler (application commands, E09-F02-S02)
 *   - GetNoteHandler (application query, E09-F02-S02)
 *   - GenerateQuizHandler, ApplyQuizHandler, DiscardQuizHandler,
 *     ListQuizzesHandler, GetQuizHandler (E29-F02-S01)
 *   - PrismaLessonProgressRepository bound behind LESSON_PROGRESS_REPOSITORY
 *   - PrismaBookmarkRepository bound behind BOOKMARK_REPOSITORY
 *   - PrismaNoteRepository bound behind NOTE_REPOSITORY
 *   - PrismaQuizRepository bound behind QUIZ_REPOSITORY
 *   - LLAMA_ADAPTER factory: MockLlamaAdapter or LocalLlamaAdapter depending
 *     on AppConfig.quizGeneration.mode — same shape as CatalogModule's
 *     WHISPER_ADAPTER factory
 *   - QuizGenerationLockService — in-memory per-course concurrency guard
 *   - CatalogRepositoriesModule — provides LESSON_REPOSITORY +
 *     COURSE_REPOSITORY + TRANSCRIPT_REPOSITORY
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
import { AdminGuard } from '../../common/auth/admin.guard';
import { AppConfig } from '../../common/config/app-config';
import { ApplyQuizHandler } from './application/commands/apply-quiz.handler';
import { CreateBookmarkHandler } from './application/commands/create-bookmark.handler';
import { DeleteBookmarkHandler } from './application/commands/delete-bookmark.handler';
import { DeleteNoteHandler } from './application/commands/delete-note.handler';
import { DiscardQuizHandler } from './application/commands/discard-quiz.handler';
import { GenerateQuizHandler } from './application/commands/generate-quiz.handler';
import { RecordProgressBatchHandler } from './application/commands/record-progress-batch.handler';
import { RecordProgressHandler } from './application/commands/record-progress.handler';
import { UpdateBookmarkHandler } from './application/commands/update-bookmark.handler';
import { UpsertNoteHandler } from './application/commands/upsert-note.handler';
import { QuizGenerationLockService } from './application/quiz-generation-lock.service';
import { GetLessonProgressHandler } from './application/queries/get-lesson-progress.handler';
import { GetNoteHandler } from './application/queries/get-note.handler';
import { GetQuizHandler } from './application/queries/get-quiz.handler';
import { ListBookmarksHandler } from './application/queries/list-bookmarks.handler';
import { ListQuizzesHandler } from './application/queries/list-quizzes.handler';
import { BOOKMARK_REPOSITORY } from './domain/bookmark/bookmark.repository';
import { LLAMA_ADAPTER } from './domain/quiz/llama.port';
import { QUIZ_REPOSITORY } from './domain/quiz/quiz.repository';
import { NOTE_REPOSITORY } from './domain/note/note.repository';
import { LESSON_PROGRESS_REPOSITORY } from './domain/progress/lesson-progress.repository';
import { LocalLlamaAdapter } from './infra/local-llama.adapter';
import { MockLlamaAdapter } from './infra/mock-llama.adapter';
import { PrismaBookmarkRepository } from './infra/prisma-bookmark.repository';
import { PrismaNoteRepository } from './infra/prisma-note.repository';
import { PrismaLessonProgressRepository } from './infra/prisma-lesson-progress.repository';
import { PrismaQuizRepository } from './infra/prisma-quiz.repository';
import { BookmarksController } from './bookmarks.controller';
import { GenerateCourseQuizController } from './generate-course-quiz.controller';
import { GenerateLessonQuizController } from './generate-lesson-quiz.controller';
import { NotesController } from './notes.controller';
import { ProgressController } from './progress.controller';
import { QuizzesController } from './quizzes.controller';

import type { LlamaAdapter } from './domain/quiz/llama.port';

@Module({
  imports: [CqrsModule, CommonAccessModule, CatalogRepositoriesModule],
  controllers: [
    ProgressController,
    BookmarksController,
    NotesController,
    GenerateLessonQuizController,
    GenerateCourseQuizController,
    QuizzesController,
  ],
  providers: [
    AdminGuard,
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
    GenerateQuizHandler,
    ApplyQuizHandler,
    DiscardQuizHandler,
    ListQuizzesHandler,
    GetQuizHandler,
    QuizGenerationLockService,
    { provide: LESSON_PROGRESS_REPOSITORY, useClass: PrismaLessonProgressRepository },
    { provide: BOOKMARK_REPOSITORY, useClass: PrismaBookmarkRepository },
    { provide: NOTE_REPOSITORY, useClass: PrismaNoteRepository },
    { provide: QUIZ_REPOSITORY, useClass: PrismaQuizRepository },
    {
      provide: LLAMA_ADAPTER,
      useFactory: (config: AppConfig): LlamaAdapter =>
        config.quizGeneration.mode === 'mock'
          ? new MockLlamaAdapter()
          : new LocalLlamaAdapter(config),
      inject: [AppConfig],
    },
  ],
})
export class LearningModule {}

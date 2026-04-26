/**
 * WHY this file exists:
 * Composition root for the Learning bounded context (first slice: E09-F01-S01).
 * Wires together:
 *   - ProgressController — POST /progress, GET /progress/:lessonId
 *   - RecordProgressHandler (application command)
 *   - GetLessonProgressHandler (application query)
 *   - PrismaLessonProgressRepository bound behind LESSON_PROGRESS_REPOSITORY
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
import { RecordProgressHandler } from './application/commands/record-progress.handler';
import { GetLessonProgressHandler } from './application/queries/get-lesson-progress.handler';
import { LESSON_PROGRESS_REPOSITORY } from './domain/progress/lesson-progress.repository';
import { PrismaLessonProgressRepository } from './infra/prisma-lesson-progress.repository';
import { ProgressController } from './progress.controller';

@Module({
  imports: [CqrsModule, CommonAccessModule, CatalogRepositoriesModule],
  controllers: [ProgressController],
  providers: [
    RecordProgressHandler,
    GetLessonProgressHandler,
    { provide: LESSON_PROGRESS_REPOSITORY, useClass: PrismaLessonProgressRepository },
  ],
})
export class LearningModule {}

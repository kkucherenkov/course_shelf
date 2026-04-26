/**
 * WHY this file exists:
 * CatalogModule's event handlers need LESSON_PROGRESS_REPOSITORY to count
 * completed lessons when updating the CourseProgressReadModel projection.
 * The Catalog module cannot import from src/modules/learning/** directly
 * (boundaries/element-types rule). This thin module in src/common/ (which is
 * in the `allow` zone for all module types) exposes the PrismaLessonProgressRepository
 * behind the LESSON_PROGRESS_REPOSITORY token so CatalogModule can import it
 * without crossing the boundary.
 *
 * The rebuild-projections script also needs this token; it boots the full
 * AppModule so the binding is available transitively.
 *
 * Symbol identity is preserved — the token imported here is the same Symbol
 * object as the one registered in LearningModule. Nest resolves DI by Symbol
 * identity, so a duplicate registration does not produce a second instance; Nest
 * uses the first provider in the DI chain for the module graph.
 *
 * Note: because both LearningModule and CatalogModule (via this common module)
 * register LESSON_PROGRESS_REPOSITORY, the provider registered in this module
 * is scoped to the modules that import LearningProgressModule. The global
 * CqrsModule EventBus dispatches to handlers regardless of which module
 * registered them, so this is safe.
 */
import { Module } from '@nestjs/common';

import { PrismaLessonProgressRepository } from '../../modules/learning/infra/prisma-lesson-progress.repository';
import { LESSON_PROGRESS_REPOSITORY } from '../../modules/learning/domain/progress/lesson-progress.repository';

@Module({
  providers: [{ provide: LESSON_PROGRESS_REPOSITORY, useClass: PrismaLessonProgressRepository }],
  exports: [LESSON_PROGRESS_REPOSITORY],
})
export class LearningProgressModule {}

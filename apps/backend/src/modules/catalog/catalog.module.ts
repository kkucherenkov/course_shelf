/**
 * WHY this file exists:
 * Composition root for the Catalog bounded context. It wires together:
 *   - CatalogController (HTTP entry point for library CRUD)
 *   - ScansController (HTTP entry point for scan operations)
 *   - CoursesController (HTTP entry point for course CRUD)
 *   - LessonsController (HTTP entry point for lesson reads)
 *   - HomeController (HTTP entry point for home-row endpoints)
 *   - Command/query handlers (application layer)
 *   - Event handlers subscribing to Learning events:
 *     - LessonCompletedHandler
 *     - LessonProgressRecordedHandler
 *   - PrismaLibraryRepository bound behind the LIBRARY_REPOSITORY port token
 *   - PrismaScanRepository bound behind the SCAN_REPOSITORY port token
 *   - PrismaCourseRepository bound behind the COURSE_REPOSITORY port token
 *   - PrismaLessonRepository bound behind the LESSON_REPOSITORY port token
 *   - PrismaCourseProgressReadModelRepository bound behind
 *     COURSE_PROGRESS_READ_MODEL_REPOSITORY
 *   - NodeFsAdapter bound behind the FS_ADAPTER port token
 *   - LocalFfmpegAdapter bound behind the FFMPEG_ADAPTER port token
 *   - AdminGuard (provided here for ScansController/CoursesController)
 *
 * Learning-side ports (LESSON_PROGRESS_REPOSITORY) are imported via
 * LearningProgressModule — a thin common module that exposes the Prisma adapter
 * behind the LESSON_PROGRESS_REPOSITORY token. This avoids a direct cross-module
 * import from src/modules/learning/** (boundaries/element-types rule).
 *
 * Nothing outside this module knows about the Prisma adapters or NodeFsAdapter.
 * exports: [] — cross-module access goes through events or public commands/queries.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { CommonAccessModule } from '../../common/access/access.module';
import { LearningProgressModule } from '../../common/learning-progress/learning-progress.module';
import { RegisterLibraryHandler } from './application/commands/register-library.handler';
import { UpdateLibraryHandler } from './application/commands/update-library.handler';
import { RemoveLibraryHandler } from './application/commands/remove-library.handler';
import { RunScanHandler } from './application/commands/run-scan.handler';
import { UpdateCourseMetadataHandler } from './application/commands/update-course-metadata.handler';
import { MarkCourseCompleteHandler } from './application/commands/mark-course-complete.handler';
import { ResetCourseProgressHandler } from './application/commands/reset-course-progress.handler';
import { GetLibraryHandler } from './application/queries/get-library.handler';
import { GetLatestScanHandler } from './application/queries/get-latest-scan.handler';
import { ListLibrariesHandler } from './application/queries/list-libraries.handler';
import { GetCourseHandler } from './application/queries/get-course.handler';
import { ListCoursesHandler } from './application/queries/list-courses.handler';
import { GetLessonHandler } from './application/queries/get-lesson.handler';
import { GetContinueWatchingHandler } from './application/queries/get-continue-watching.handler';
import { GetCourseOutlineHandler } from './application/queries/get-course-outline.handler';
import { GetRecentlyAddedHandler } from './application/queries/get-recently-added.handler';
import { GetRecentlyCompletedHandler } from './application/queries/get-recently-completed.handler';
import { GetYourWeekHandler } from './application/queries/get-your-week.handler';
import { LessonCompletedHandler } from './application/event-handlers/lesson-completed.handler';
import { LessonProgressRecordedHandler } from './application/event-handlers/lesson-progress-recorded.handler';
import { RebuildProjectionsService } from './application/projections/rebuild-projections.service';
import { CatalogController } from './catalog.controller';
import { CoursesController } from './courses.controller';
import { HomeController } from './home.controller';
import { LessonsController } from './lessons.controller';
import { ScansController } from './scans.controller';
import { LIBRARY_REPOSITORY } from './domain/library/library.repository';
import { SCAN_REPOSITORY } from './domain/scan/scan.repository';
import { COURSE_REPOSITORY } from './domain/course/course.repository';
import { LESSON_REPOSITORY } from './domain/lesson/lesson.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from './domain/progress/course-progress-read-model.repository';
import { FFMPEG_ADAPTER } from './domain/scan/ffmpeg-adapter';
import { FS_ADAPTER } from './domain/scan/fs-adapter';
import { PrismaLibraryRepository } from './infra/prisma-library.repository';
import { PrismaScanRepository } from './infra/prisma-scan.repository';
import { PrismaCourseRepository } from './infra/prisma-course.repository';
import { PrismaLessonRepository } from './infra/prisma-lesson.repository';
import { PrismaCourseProgressReadModelRepository } from './infra/prisma-course-progress-read-model.repository';
import { LocalFfmpegAdapter } from './infra/local-ffmpeg.adapter';
import { NodeFsAdapter } from './infra/node-fs-adapter';

@Module({
  imports: [CqrsModule, CommonAccessModule, LearningProgressModule],
  controllers: [
    CatalogController,
    ScansController,
    CoursesController,
    LessonsController,
    HomeController,
  ],
  providers: [
    RegisterLibraryHandler,
    UpdateLibraryHandler,
    RemoveLibraryHandler,
    GetLibraryHandler,
    ListLibrariesHandler,
    RunScanHandler,
    GetLatestScanHandler,
    UpdateCourseMetadataHandler,
    MarkCourseCompleteHandler,
    ResetCourseProgressHandler,
    GetCourseHandler,
    ListCoursesHandler,
    GetLessonHandler,
    GetContinueWatchingHandler,
    GetCourseOutlineHandler,
    GetRecentlyAddedHandler,
    GetRecentlyCompletedHandler,
    GetYourWeekHandler,
    LessonCompletedHandler,
    LessonProgressRecordedHandler,
    RebuildProjectionsService,
    AdminGuard,
    { provide: LIBRARY_REPOSITORY, useClass: PrismaLibraryRepository },
    { provide: SCAN_REPOSITORY, useClass: PrismaScanRepository },
    { provide: COURSE_REPOSITORY, useClass: PrismaCourseRepository },
    { provide: LESSON_REPOSITORY, useClass: PrismaLessonRepository },
    {
      provide: COURSE_PROGRESS_READ_MODEL_REPOSITORY,
      useClass: PrismaCourseProgressReadModelRepository,
    },
    { provide: FS_ADAPTER, useClass: NodeFsAdapter },
    { provide: FFMPEG_ADAPTER, useClass: LocalFfmpegAdapter },
  ],
})
export class CatalogModule {}

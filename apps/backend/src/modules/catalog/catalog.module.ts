/**
 * WHY this file exists:
 * Composition root for the Catalog bounded context. It wires together:
 *   - CatalogController (HTTP entry point for library CRUD)
 *   - ScansController (HTTP entry point for scan operations)
 *   - CoursesController (HTTP entry point for course CRUD)
 *   - LessonsController (HTTP entry point for lesson reads)
 *   - HomeController (HTTP entry point for home-row endpoints)
 *   - CatalogScrapeAdminController (admin scrape-preview + scrapers list)
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
 *   - PrismaInstructorRepository bound behind INSTRUCTOR_REPOSITORY
 *   - PrismaStudioRepository bound behind STUDIO_REPOSITORY
 *   - PrismaTagRepository bound behind TAG_REPOSITORY
 *   - PrismaExternalIdRepository bound behind EXTERNAL_ID_REPOSITORY
 *   - NodeFsAdapter bound behind the FS_ADAPTER port token
 *   - LocalFfmpegAdapter bound behind the FFMPEG_ADAPTER port token
 *   - AdminGuard (provided here for ScansController/CoursesController)
 *   - SCRAPER_REGISTRY factory: mock or real (YouTube/Udemy/JsonLd) depending
 *     on AppConfig.scrapers.mode / youtube.configured / udemy.enabled
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

import { AppConfig } from '../../common/config/app-config';
import { AdminGuard } from '../../common/auth/admin.guard';
import { ScrapeCourseHandler } from './application/commands/scrape-course.handler';
import { CatalogScrapeAdminController } from './catalog-scrape-admin.controller';
import { SCRAPER_REGISTRY } from './domain/scraper/scraper.port';
import { DefaultScraperRegistry } from './infra/scrapers/scraper.registry';
import { HttpFetcher } from './infra/scrapers/http-fetcher';
import { HtmlMetadataExtractor } from './infra/scrapers/html-metadata.extractor';
import { JsonLdScraper } from './infra/scrapers/json-ld.scraper';
import { UdemyScraper } from './infra/scrapers/udemy.scraper';
import { YouTubeScraper } from './infra/scrapers/youtube.scraper';
import { createMockScrapers } from './infra/scrapers/mock.scrapers';

import type { Scraper } from './domain/scraper/scraper.port';
import { CommonAccessModule } from '../../common/access/access.module';
import { LearningProgressModule } from '../../common/learning-progress/learning-progress.module';
import { RegisterLibraryHandler } from './application/commands/register-library.handler';
import { UpdateLibraryHandler } from './application/commands/update-library.handler';
import { RemoveLibraryHandler } from './application/commands/remove-library.handler';
import { RunScanHandler } from './application/commands/run-scan.handler';
import { UpdateCourseMetadataHandler } from './application/commands/update-course-metadata.handler';
import { MarkCourseCompleteHandler } from './application/commands/mark-course-complete.handler';
import { ResetCourseProgressHandler } from './application/commands/reset-course-progress.handler';
import { UpsertInstructorHandler } from './application/commands/upsert-instructor.handler';
import { UpsertStudioHandler } from './application/commands/upsert-studio.handler';
import { UpsertTagHandler } from './application/commands/upsert-tag.handler';
import { BackfillCourseMetadataHandler } from './application/commands/backfill-course-metadata.handler';
import { SetCourseInstructorsHandler } from './application/commands/set-course-instructors.handler';
import { SetCourseStudiosHandler } from './application/commands/set-course-studios.handler';
import { SetCourseTagsHandler } from './application/commands/set-course-tags.handler';
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
import { SearchCatalogueHandler } from './application/queries/search-catalogue.handler';
import { ListInstructorsHandler } from './application/queries/list-instructors.handler';
import { GetInstructorHandler } from './application/queries/get-instructor.handler';
import { ListStudiosHandler } from './application/queries/list-studios.handler';
import { GetStudioHandler } from './application/queries/get-studio.handler';
import { ListTagsHandler } from './application/queries/list-tags.handler';
import { GetTagHandler } from './application/queries/get-tag.handler';
import { MetadataLinker } from './application/scan/metadata-linker';
import { LessonCompletedHandler } from './application/event-handlers/lesson-completed.handler';
import { LessonProgressRecordedHandler } from './application/event-handlers/lesson-progress-recorded.handler';
import { RebuildProjectionsService } from './application/projections/rebuild-projections.service';
import { CatalogController } from './catalog.controller';
import { CatalogEntitiesController } from './catalog-entities.controller';
import { CatalogEntitiesAdminController } from './catalog-entities-admin.controller';
import { CoursesController } from './courses.controller';
import { HomeController } from './home.controller';
import { LessonsController } from './lessons.controller';
import { ScansController } from './scans.controller';
import { SearchController } from './search.controller';
import { LIBRARY_REPOSITORY } from './domain/library/library.repository';
import { SCAN_REPOSITORY } from './domain/scan/scan.repository';
import { COURSE_REPOSITORY } from './domain/course/course.repository';
import { LESSON_REPOSITORY } from './domain/lesson/lesson.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from './domain/progress/course-progress-read-model.repository';
import { FFMPEG_ADAPTER } from './domain/scan/ffmpeg-adapter';
import { FS_ADAPTER } from './domain/scan/fs-adapter';
import { SEARCH_PORT } from './domain/search.port';
import { INSTRUCTOR_REPOSITORY } from './domain/instructor/instructor.repository';
import { STUDIO_REPOSITORY } from './domain/studio/studio.repository';
import { TAG_REPOSITORY } from './domain/tag/tag.repository';
import { EXTERNAL_ID_REPOSITORY } from './domain/shared-vo/external-id.repository';
import { PrismaLibraryRepository } from './infra/prisma-library.repository';
import { PrismaScanRepository } from './infra/prisma-scan.repository';
import { PrismaCourseRepository } from './infra/prisma-course.repository';
import { PrismaLessonRepository } from './infra/prisma-lesson.repository';
import { PrismaCourseProgressReadModelRepository } from './infra/prisma-course-progress-read-model.repository';
import { PrismaInstructorRepository } from './infra/prisma-instructor.repository';
import { PrismaStudioRepository } from './infra/prisma-studio.repository';
import { PrismaTagRepository } from './infra/prisma-tag.repository';
import { PrismaExternalIdRepository } from './infra/prisma-external-id.repository';
import { PrismaSearchAdapter } from './infra/prisma-search.adapter';
import { LocalFfmpegAdapter } from './infra/local-ffmpeg.adapter';
import { NodeFsAdapter } from './infra/node-fs-adapter';

@Module({
  imports: [CqrsModule, CommonAccessModule, LearningProgressModule],
  controllers: [
    CatalogController,
    CatalogEntitiesController,
    CatalogEntitiesAdminController,
    CatalogScrapeAdminController,
    ScansController,
    CoursesController,
    LessonsController,
    HomeController,
    SearchController,
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
    UpsertInstructorHandler,
    UpsertStudioHandler,
    UpsertTagHandler,
    SetCourseInstructorsHandler,
    SetCourseStudiosHandler,
    SetCourseTagsHandler,
    GetCourseHandler,
    ListCoursesHandler,
    GetLessonHandler,
    GetContinueWatchingHandler,
    GetCourseOutlineHandler,
    GetRecentlyAddedHandler,
    GetRecentlyCompletedHandler,
    GetYourWeekHandler,
    SearchCatalogueHandler,
    ListInstructorsHandler,
    GetInstructorHandler,
    ListStudiosHandler,
    GetStudioHandler,
    ListTagsHandler,
    GetTagHandler,
    BackfillCourseMetadataHandler,
    ScrapeCourseHandler,
    {
      provide: SCRAPER_REGISTRY,
      useFactory: (config: AppConfig): DefaultScraperRegistry => {
        if (config.scrapers.mode === 'mock') {
          return new DefaultScraperRegistry(createMockScrapers());
        }
        const fetcher = new HttpFetcher(config.scrapers);
        const extractor = new HtmlMetadataExtractor();
        const scrapers: Scraper[] = [];
        if (config.scrapers.youtube.configured) {
          scrapers.push(new YouTubeScraper(fetcher, config.scrapers.youtube.apiKey));
        }
        if (config.scrapers.udemy.enabled) {
          scrapers.push(new UdemyScraper(fetcher, extractor));
        }
        scrapers.push(new JsonLdScraper(fetcher, extractor)); // generic fallback LAST
        return new DefaultScraperRegistry(scrapers);
      },
      inject: [AppConfig],
    },
    MetadataLinker,
    LessonCompletedHandler,
    LessonProgressRecordedHandler,
    RebuildProjectionsService,
    AdminGuard,
    { provide: EXTERNAL_ID_REPOSITORY, useClass: PrismaExternalIdRepository },
    { provide: LIBRARY_REPOSITORY, useClass: PrismaLibraryRepository },
    { provide: SCAN_REPOSITORY, useClass: PrismaScanRepository },
    { provide: COURSE_REPOSITORY, useClass: PrismaCourseRepository },
    { provide: LESSON_REPOSITORY, useClass: PrismaLessonRepository },
    {
      provide: COURSE_PROGRESS_READ_MODEL_REPOSITORY,
      useClass: PrismaCourseProgressReadModelRepository,
    },
    { provide: INSTRUCTOR_REPOSITORY, useClass: PrismaInstructorRepository },
    { provide: STUDIO_REPOSITORY, useClass: PrismaStudioRepository },
    { provide: TAG_REPOSITORY, useClass: PrismaTagRepository },
    { provide: FS_ADAPTER, useClass: NodeFsAdapter },
    { provide: FFMPEG_ADAPTER, useClass: LocalFfmpegAdapter },
    { provide: SEARCH_PORT, useClass: PrismaSearchAdapter },
  ],
  exports: [
    EXTERNAL_ID_REPOSITORY,
    INSTRUCTOR_REPOSITORY,
    STUDIO_REPOSITORY,
    TAG_REPOSITORY,
    COURSE_REPOSITORY,
  ],
})
export class CatalogModule {}

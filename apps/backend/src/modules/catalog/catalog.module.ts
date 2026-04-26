/**
 * WHY this file exists:
 * Composition root for the Catalog bounded context. It wires together:
 *   - CatalogController (HTTP entry point for library CRUD)
 *   - ScansController (HTTP entry point for scan operations)
 *   - CoursesController (HTTP entry point for course CRUD)
 *   - Command/query handlers (application layer)
 *   - PrismaLibraryRepository bound behind the LIBRARY_REPOSITORY port token
 *   - PrismaScanRepository bound behind the SCAN_REPOSITORY port token
 *   - PrismaCourseRepository bound behind the COURSE_REPOSITORY port token
 *   - NodeFsAdapter bound behind the FS_ADAPTER port token
 *   - AdminGuard (provided here for ScansController/CoursesController; AuthService is global via AuthModule)
 *
 * Nothing outside this module knows about the Prisma adapters or NodeFsAdapter.
 * If we ever swap an adapter, only this binding changes.
 *
 * exports: [] — cross-module access goes through events or a public facade,
 * never through direct imports. The boundaries/element-types ESLint rule
 * enforces this at the module level.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { CommonAccessModule } from '../../common/access/access.module';
import { RegisterLibraryHandler } from './application/commands/register-library.handler';
import { RunScanHandler } from './application/commands/run-scan.handler';
import { UpdateCourseMetadataHandler } from './application/commands/update-course-metadata.handler';
import { GetLibraryHandler } from './application/queries/get-library.handler';
import { GetLatestScanHandler } from './application/queries/get-latest-scan.handler';
import { ListLibrariesHandler } from './application/queries/list-libraries.handler';
import { GetCourseHandler } from './application/queries/get-course.handler';
import { ListCoursesHandler } from './application/queries/list-courses.handler';
import { CatalogController } from './catalog.controller';
import { CoursesController } from './courses.controller';
import { ScansController } from './scans.controller';
import { LIBRARY_REPOSITORY } from './domain/library/library.repository';
import { SCAN_REPOSITORY } from './domain/scan/scan.repository';
import { COURSE_REPOSITORY } from './domain/course/course.repository';
import { FS_ADAPTER } from './domain/scan/fs-adapter';
import { PrismaLibraryRepository } from './infra/prisma-library.repository';
import { PrismaScanRepository } from './infra/prisma-scan.repository';
import { PrismaCourseRepository } from './infra/prisma-course.repository';
import { NodeFsAdapter } from './infra/node-fs-adapter';

@Module({
  imports: [CqrsModule, CommonAccessModule],
  controllers: [CatalogController, ScansController, CoursesController],
  providers: [
    RegisterLibraryHandler,
    GetLibraryHandler,
    ListLibrariesHandler,
    RunScanHandler,
    GetLatestScanHandler,
    UpdateCourseMetadataHandler,
    GetCourseHandler,
    ListCoursesHandler,
    AdminGuard,
    { provide: LIBRARY_REPOSITORY, useClass: PrismaLibraryRepository },
    { provide: SCAN_REPOSITORY, useClass: PrismaScanRepository },
    { provide: COURSE_REPOSITORY, useClass: PrismaCourseRepository },
    { provide: FS_ADAPTER, useClass: NodeFsAdapter },
  ],
})
export class CatalogModule {}

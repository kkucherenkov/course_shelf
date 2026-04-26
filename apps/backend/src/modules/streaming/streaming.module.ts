/**
 * WHY this file exists:
 * Composition root for the Streaming bounded context (slices E08-F01-S01 and
 * E08-F02-S01). Wires together:
 *   - StreamingController
 *       GET /lessons/:id/stream-url  — issues a short-lived signed stream token
 *       GET /stream/lessons/:id      — range-aware binary streaming endpoint
 *   - IssueStreamTokenHandler (application query)
 *   - StreamTokenSigner (domain service)
 *   - LessonFileLocator (domain service, E08-F02-S01)
 *   - CatalogRepositoriesModule (provides LESSON_REPOSITORY + COURSE_REPOSITORY +
 *     LIBRARY_REPOSITORY via src/common/ so we never import catalog source files
 *     directly; LIBRARY_REPOSITORY added for E08-F02-S01)
 *   - CommonAccessModule (provides AUTHORIZATION_SERVICE)
 *
 * Dependency-boundary note:
 *   This module MUST NOT import anything from src/modules/catalog/**. All
 *   catalog dependencies flow through src/common/catalog-tokens/ which is in
 *   the `allow` zone for all bounded contexts (boundaries/element-types).
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CommonAccessModule } from '../../common/access/access.module';
import { CatalogRepositoriesModule } from '../../common/catalog-tokens/catalog-repositories.module';
import { IssueStreamTokenHandler } from './application/queries/issue-stream-token.handler';
import { LessonFileLocator } from './domain/lesson-file-locator';
import { StreamTokenSigner } from './domain/stream-token/stream-token-signer';
import { StreamingController } from './streaming.controller';

@Module({
  imports: [CqrsModule, CommonAccessModule, CatalogRepositoriesModule],
  controllers: [StreamingController],
  providers: [IssueStreamTokenHandler, StreamTokenSigner, LessonFileLocator],
})
export class StreamingModule {}

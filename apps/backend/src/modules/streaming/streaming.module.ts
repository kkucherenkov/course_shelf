/**
 * WHY this file exists:
 * Composition root for the Streaming bounded context (first slice: E08-F01-S01).
 * Wires together:
 *   - StreamingController (GET /lessons/:id/stream-url)
 *   - IssueStreamTokenHandler (application query)
 *   - StreamTokenSigner (domain service)
 *   - CatalogRepositoriesModule (provides LESSON_REPOSITORY + COURSE_REPOSITORY
 *     via src/common/ so we never import catalog source files directly)
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
import { StreamTokenSigner } from './domain/stream-token/stream-token-signer';
import { StreamingController } from './streaming.controller';

@Module({
  imports: [CqrsModule, CommonAccessModule, CatalogRepositoriesModule],
  controllers: [StreamingController],
  providers: [IssueStreamTokenHandler, StreamTokenSigner],
})
export class StreamingModule {}

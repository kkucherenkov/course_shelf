/**
 * WHY this file exists:
 * Composition root for the Catalog bounded context. It wires together:
 *   - CatalogController (HTTP entry point)
 *   - Command/query handlers (application layer)
 *   - PrismaLibraryRepository bound behind the LIBRARY_REPOSITORY port token
 *
 * Nothing outside this module knows about PrismaLibraryRepository. If we ever
 * swap the adapter (e.g. for a read replica), only this binding changes.
 *
 * exports: [] — cross-module access goes through events or a public facade,
 * never through direct imports. The boundaries/element-types ESLint rule
 * enforces this at the module level.
 */
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { RegisterLibraryHandler } from './application/commands/register-library.handler';
import { GetLibraryHandler } from './application/queries/get-library.handler';
import { ListLibrariesHandler } from './application/queries/list-libraries.handler';
import { CatalogController } from './catalog.controller';
import { LIBRARY_REPOSITORY } from './domain/library/library.repository';
import { PrismaLibraryRepository } from './infra/prisma-library.repository';

@Module({
  imports: [CqrsModule],
  controllers: [CatalogController],
  providers: [
    RegisterLibraryHandler,
    GetLibraryHandler,
    ListLibrariesHandler,
    { provide: LIBRARY_REPOSITORY, useClass: PrismaLibraryRepository },
  ],
})
export class CatalogModule {}

/**
 * DI smoke test for CatalogRepositoriesModule.
 *
 * WHY: this module re-provides catalog Prisma adapters behind domain tokens
 * for consumers outside the catalog context (Streaming, Learning). The
 * adapters' constructor dependencies evolve inside CatalogModule — when an
 * adapter gains a new @Inject (as PrismaCourseRepository did with
 * EXTERNAL_ID_REPOSITORY in the enrichment work, #208), this module must
 * provide it too, or every importer crashes at application bootstrap with
 * UnknownDependenciesException. Unit tests never boot this wiring, so the
 * breakage only surfaced in the nightly e2e stack. This spec compiles the
 * module in isolation and resolves every exported token.
 */
import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { PrismaService } from '../prisma/prisma.service';
import { COURSE_REPOSITORY } from '../../modules/catalog/domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../modules/catalog/domain/lesson/lesson.repository';
import { LIBRARY_REPOSITORY } from '../../modules/catalog/domain/library/library.repository';
import { CatalogRepositoriesModule } from './catalog-repositories.module';

// PrismaService is normally contributed by the app's @Global PrismaModule;
// stub it the same way so the module compiles in isolation.
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: {} }],
  exports: [PrismaService],
})
class PrismaStubModule {}

describe('CatalogRepositoriesModule', () => {
  it('compiles and resolves every exported repository token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaStubModule, CatalogRepositoriesModule],
    }).compile();

    for (const token of [LESSON_REPOSITORY, COURSE_REPOSITORY, LIBRARY_REPOSITORY]) {
      expect(moduleRef.get(token)).toBeDefined();
    }

    await moduleRef.close();
  });
});

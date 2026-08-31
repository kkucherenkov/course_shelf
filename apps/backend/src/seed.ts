/**
 * WHY this file exists:
 * CLI entry point for `pnpm --filter @app/backend db:seed`. Boots a Nest
 * standalone application context so the seed writes through the real
 * repository adapters — the aggregates enforce their own invariants, so the
 * seed cannot construct a catalog the domain forbids.
 *
 * WHY it lives in `src/` and not `prisma/seed.ts`:
 * Nothing can execute this repository's TypeScript directly. Node's
 * `--experimental-strip-types` rejects NestJS parameter properties
 * (`constructor(@Inject(T) private readonly x: T)`) outright and cannot
 * resolve the codebase's extensionless relative imports; `tsx` resolves both
 * but is esbuild-backed, which does not emit `design:paramtypes`, so the DI
 * container cannot resolve a single implicitly-typed constructor argument.
 * Compiling with the app is the only way to get a real container — and it has
 * a second payoff: `dist/seed.js` is already inside the production image, so
 * `e2e.yml` seeds with `docker compose exec backend`, without publishing the
 * CI database's port to the runner.
 *
 * (`scripts/rebuild-projections.ts` and `scripts/backfill-course-metadata.ts`
 * are declared the same broken way and fail on the first import; tracked
 * separately.)
 */

// reflect-metadata must be imported before any NestJS module.
import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { COURSE_REPOSITORY } from './modules/catalog/domain/course/course.repository';
import { INSTRUCTOR_REPOSITORY } from './modules/catalog/domain/instructor/instructor.repository';
import { LESSON_REPOSITORY } from './modules/catalog/domain/lesson/lesson.repository';
import { LIBRARY_REPOSITORY } from './modules/catalog/domain/library/library.repository';
import { STUDIO_REPOSITORY } from './modules/catalog/domain/studio/studio.repository';
import { TAG_REPOSITORY } from './modules/catalog/domain/tag/tag.repository';
import { seedCatalog } from './seed-catalog';

import type { CourseRepository } from './modules/catalog/domain/course/course.repository';
import type { InstructorRepository } from './modules/catalog/domain/instructor/instructor.repository';
import type { LessonRepository } from './modules/catalog/domain/lesson/lesson.repository';
import type { LibraryRepository } from './modules/catalog/domain/library/library.repository';
import type { StudioRepository } from './modules/catalog/domain/studio/studio.repository';
import type { TagRepository } from './modules/catalog/domain/tag/tag.repository';

async function main(): Promise<void> {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    await seedCatalog(
      {
        libraries: app.get<LibraryRepository>(LIBRARY_REPOSITORY),
        courses: app.get<CourseRepository>(COURSE_REPOSITORY),
        lessons: app.get<LessonRepository>(LESSON_REPOSITORY),
        instructors: app.get<InstructorRepository>(INSTRUCTOR_REPOSITORY),
        studios: app.get<StudioRepository>(STUDIO_REPOSITORY),
        tags: app.get<TagRepository>(TAG_REPOSITORY),
      },
      logger,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : String(error), undefined, 'Seed');
  process.exit(1);
});

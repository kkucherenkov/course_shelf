/**
 * WHY this file exists:
 * CLI entry point for rebuilding the CourseProgressReadModel projection table.
 * Boots a Nest standalone application context, runs RebuildProjectionsService,
 * then exits cleanly. Safe to run at any time — the service is idempotent.
 *
 * Usage:
 *   pnpm --filter @app/backend rebuild-projections
 *
 * The script uses Node's --experimental-strip-types so it can import TypeScript
 * source directly without a compilation step (see package.json `scripts`).
 */

// reflect-metadata must be imported before any NestJS module.
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { RebuildProjectionsService } from '../src/modules/catalog/application/projections/rebuild-projections.service';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const service = app.get(RebuildProjectionsService);
  await service.rebuild();

  await app.close();
}

main().catch((err: unknown) => {
  console.error('rebuild-projections failed:', err);
  process.exit(1);
});

/**
 * WHY this file exists:
 * CLI entry point for backfilling course metadata (instructor, studio, tag,
 * level, language, releaseDate, posterUrl, externalIds) from course.json
 * for all existing courses in the library — or a single library when a
 * libraryId is passed as the first positional argument.
 *
 * Usage:
 *   pnpm --filter @app/backend backfill:metadata
 *   pnpm --filter @app/backend backfill:metadata <libraryId>
 *
 * The script boots a NestJS standalone application context, dispatches
 * BackfillCourseMetadataCommand synchronously (no progress channel — silent
 * run), prints the result as JSON, and exits.
 *
 * Exit codes:
 *   0 — completed (errors[] may be non-empty; those are per-course failures,
 *       not a fatal crash).
 *   1 — unexpected exception (Nest bootstrap failed, etc.).
 */

// reflect-metadata must be imported before any NestJS module.
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AppModule } from '../src/app.module';
import { BackfillCourseMetadataCommand } from '../src/modules/catalog/application/commands/backfill-course-metadata.command';

async function main(): Promise<void> {
  const libraryId: string | undefined = process.argv[2];

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const bus = app.get(CommandBus);
  const jobId = `cli-${nanoid()}`;

  const result = await bus.execute(new BackfillCourseMetadataCommand(libraryId, jobId, undefined));

  // eslint-disable-next-line no-console -- CLI output is intentional
  console.log(JSON.stringify(result, null, 2));

  await app.close();
  process.exit(0);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console -- CLI error output
  console.error('Backfill failed:', err);
  process.exit(1);
});

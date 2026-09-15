/**
 * WHY this file exists:
 * CLI entry point for #555 — classifying `generated` Transcript rows stuck at
 * `language: 'und'` from their own cue text instead of re-transcribing.
 *
 * Lives in `src/`, not `scripts/`, and is compiled by `nest build` rather
 * than run with `node --experimental-strip-types` — the same reason
 * `seed.ts` does (see its own header): this handler is injected via Nest's
 * DI container (`@Inject(TRANSCRIPT_REPOSITORY)`, parameter-property
 * constructors), which `--experimental-strip-types` cannot parse and `tsx`
 * cannot resolve types for (no `design:paramtypes` emission). `#480` already
 * cost two scripts (`scripts/rebuild-projections.ts`,
 * `scripts/backfill-course-metadata.ts`) to this exact trap.
 *
 * Usage:
 *   pnpm --filter @app/backend backfill:transcript-language
 *     — dry run (default): reports what would change, touches nothing.
 *   pnpm --filter @app/backend backfill:transcript-language -- --apply
 *     — renames each reclassified row's `.srt` and writes the row.
 *   pnpm --filter @app/backend backfill:transcript-language -- --apply --default-language=en
 *     — same, but a row whose cue text cannot be confidently classified is
 *       filed under `en` instead of staying `und`.
 *
 * Exit codes:
 *   0 — completed (errors[] may be non-empty; those are per-row failures).
 *   1 — unexpected exception (Nest bootstrap failed, etc.).
 */
import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CommandBus } from '@nestjs/cqrs';

import { AppModule } from './app.module';
import { BackfillTranscriptLanguageCommand } from './modules/catalog/application/commands/backfill-transcript-language.command';

import type { BackfillTranscriptLanguageResult } from './modules/catalog/application/commands/backfill-transcript-language.handler';

function parseArgs(argv: readonly string[]): { defaultLanguage: string; dryRun: boolean } {
  const defaultArg = argv.find((a) => a.startsWith('--default-language='));
  return {
    defaultLanguage: defaultArg?.slice('--default-language='.length) ?? 'und',
    dryRun: !argv.includes('--apply'),
  };
}

async function main(): Promise<void> {
  const { defaultLanguage, dryRun } = parseArgs(process.argv.slice(2));

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const bus = app.get(CommandBus);
  const result = await bus.execute<
    BackfillTranscriptLanguageCommand,
    BackfillTranscriptLanguageResult
  >(new BackfillTranscriptLanguageCommand(defaultLanguage, dryRun));

  // eslint-disable-next-line no-console -- CLI output is intentional
  console.log(JSON.stringify(result, null, 2));
  if (dryRun) {
    // eslint-disable-next-line no-console -- CLI output is intentional
    console.log('\nDry run — no files renamed, no rows updated. Re-run with --apply to write.');
  }

  await app.close();
  process.exit(0);
}

main().catch((error: unknown) => {
  Logger.error(
    `Backfill failed: ${error instanceof Error ? error.message : String(error)}`,
    error instanceof Error ? error.stack : undefined,
    'BackfillTranscriptLanguage',
  );
  process.exit(1);
});

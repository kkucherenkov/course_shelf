/**
 * WHY this file exists:
 * #501 (`LocalWhisperAdapter` parsing whisper's real detected-language line)
 * only fixed transcription runs FROM that point on — every `generated`
 * Transcript row written before it stayed `language: 'und'` (~1945 rows,
 * measured on the maintainer's library), shown as "Unknown" in the player's
 * CC menu. Re-transcribing all of them is weeks of CPU on this deployment's
 * hardware; the cue text those runs already produced is sitting in the
 * database, so this classifies THAT instead of the audio (#555).
 *
 * Order matters (#529): a generated `.srt`'s filename carries its language
 * (`derivedTranscriptPath`), and `LessonFileLocator` / `run-scan.handler.ts`
 * both recompute that path FROM the DB's `language` column rather than
 * trusting a stored path. Updating the column before the file is renamed
 * leaves the locator expecting a file that is not there yet; updating the
 * file after a crash leaves an orphan `.und.srt` next to the correctly-named
 * one. `TranscriptRepository.reclassifyGenerated` does both in one call, disk
 * first, so this handler cannot get the order wrong even by accident.
 *
 * Sidecar-origin `und` rows are untouched on purpose — a sidecar file's name
 * is exactly what `languageOf()` (subtitle.ts) already tried, and none of
 * this library's ~3267 subtitle files carry a language tag, so there is
 * nothing further to classify.
 *
 * Dry-run by default: the caller (the CLI script) passes `dryRun: true`
 * unless `--apply` was given. No NestJS HTTP exceptions here — boundaries/
 * element-types enforces this at lint time.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AppConfig } from '../../../../common/config/app-config';
import { classifyTranscriptLanguage } from '../../domain/transcription/classify-cue-language';
import { derivedTranscriptPath } from '../../domain/transcription/derived-path';
import { TRANSCRIPT_REPOSITORY } from '../../domain/transcription/transcript.repository';
import { BackfillTranscriptLanguageCommand } from './backfill-transcript-language.command';

import type { TranscriptRepository } from '../../domain/transcription/transcript.repository';

export interface ReclassifiedEntry {
  readonly transcriptId: string;
  readonly language: string;
  readonly oldDerivedPath: string;
  readonly newDerivedPath: string;
}

export interface BackfillTranscriptLanguageResult {
  readonly dryRun: boolean;
  readonly defaultLanguage: string;
  /** `generated` rows found at `language: 'und'` before this run. */
  readonly totalUndetermined: number;
  /** Rows the classifier called `en`/`ru` for — renamed/updated unless `dryRun`. */
  readonly reclassified: ReclassifiedEntry[];
  /** Rows still `und` — too little or too ambiguous cue text to call. */
  readonly stillUndetermined: number;
  /** Rows a `derivedTranscriptPath` traversal guard rejected — recorded, not thrown. */
  readonly errors: { transcriptId: string; message: string }[];
}

@CommandHandler(BackfillTranscriptLanguageCommand)
export class BackfillTranscriptLanguageHandler implements ICommandHandler<
  BackfillTranscriptLanguageCommand,
  BackfillTranscriptLanguageResult
> {
  constructor(
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
    private readonly appConfig: AppConfig,
  ) {}

  async execute(
    command: BackfillTranscriptLanguageCommand,
  ): Promise<BackfillTranscriptLanguageResult> {
    const rows = await this.transcripts.findGeneratedByLanguage('und');

    const reclassified: ReclassifiedEntry[] = [];
    const errors: { transcriptId: string; message: string }[] = [];
    let stillUndetermined = 0;

    for (const row of rows) {
      const language = classifyTranscriptLanguage(row.cueText, command.defaultLanguage);
      if (language === 'und') {
        stillUndetermined++;
        continue;
      }

      try {
        const newDerivedPath = derivedTranscriptPath({
          derivedRoot: this.appConfig.derivedPath,
          libraryId: row.libraryId,
          videoPath: row.sourcePath,
          language,
        });

        if (!command.dryRun) {
          await this.transcripts.reclassifyGenerated({
            transcriptId: row.transcriptId,
            oldDerivedPath: row.derivedPath,
            newDerivedPath,
            newLanguage: language,
          });
        }

        reclassified.push({
          transcriptId: row.transcriptId,
          language,
          oldDerivedPath: row.derivedPath,
          newDerivedPath,
        });
      } catch (error) {
        // One row's bad data (or a rename racing a concurrent scan) costs
        // itself, never the rest of the run.
        errors.push({
          transcriptId: row.transcriptId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      dryRun: command.dryRun,
      defaultLanguage: command.defaultLanguage,
      totalUndetermined: rows.length,
      reclassified,
      stillUndetermined,
      errors,
    };
  }
}

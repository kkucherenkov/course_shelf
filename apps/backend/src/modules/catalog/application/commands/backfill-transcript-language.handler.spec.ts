/**
 * Unit tests for BackfillTranscriptLanguageHandler.
 *
 * Uses an in-memory fake TranscriptRepository — no real DB or filesystem.
 *
 * Scenarios:
 *   1. Russian cue text → reclassified to 'ru', file renamed, row updated.
 *   2. English cue text → reclassified to 'en'.
 *   3. Ambiguous cue text → stays 'und', reclassifyGenerated never called.
 *   4. dryRun: true (default) → reclassifyGenerated never called, still
 *      reported in `reclassified`.
 *   5. A `derivedTranscriptPath` traversal guard failure is recorded in
 *      `errors`, not thrown — the run finishes and other rows still process.
 *   6. `--default-language` flows through for ambiguous rows.
 */
import { describe, expect, it, vi } from 'vitest';

import { BackfillTranscriptLanguageCommand } from './backfill-transcript-language.command';
import { BackfillTranscriptLanguageHandler } from './backfill-transcript-language.handler';

import type {
  GeneratedTranscriptByLanguage,
  ReclassifyGeneratedInput,
  TranscriptRepository,
} from '../../domain/transcription/transcript.repository';
import type { AppConfig } from '../../../../common/config/app-config';

const RUSSIAN_TEXT =
  'Добро пожаловать на этот курс. Сегодня мы поговорим о том, как устроена ' +
  'архитектура приложения и почему это важно для каждого разработчика.';

const ENGLISH_TEXT =
  'Welcome to this course. Today we are going to talk about how the ' +
  'application architecture is built and why it matters for every developer.';

function makeAppConfig(derivedPath = '/derived'): AppConfig {
  return { derivedPath } as unknown as AppConfig;
}

function makeTranscriptRepo(
  rows: GeneratedTranscriptByLanguage[],
): TranscriptRepository & { reclassifyGenerated: ReturnType<typeof vi.fn> } {
  return {
    findGeneratedForLessons: vi.fn(),
    findAnyGeneratedForLessons: vi.fn(),
    replaceGenerated: vi.fn(),
    findExisting: vi.fn(),
    replaceSidecar: vi.fn(),
    deleteForLesson: vi.fn(),
    findGeneratedByLanguage: vi.fn(async (language: string) => (language === 'und' ? rows : [])),
    reclassifyGenerated: vi.fn(async () => undefined),
    findCuesForLesson: vi.fn(async () => null),
    cueBelongsToLesson: vi.fn(async () => true),
  };
}

function row(
  overrides: Partial<GeneratedTranscriptByLanguage> = {},
): GeneratedTranscriptByLanguage {
  return {
    transcriptId: 't-1',
    libraryId: 'lib-1',
    sourcePath: 'course-1/lesson.mp4',
    derivedPath: '/derived/lib-1/course-1/lesson.mp4.und.srt',
    cueText: RUSSIAN_TEXT,
    ...overrides,
  };
}

describe('BackfillTranscriptLanguageHandler', () => {
  it('reclassifies a Russian transcript, renaming the file and updating the row', async () => {
    const transcripts = makeTranscriptRepo([row()]);
    const handler = new BackfillTranscriptLanguageHandler(transcripts, makeAppConfig());

    const result = await handler.execute(new BackfillTranscriptLanguageCommand('und', false));

    expect(result.totalUndetermined).toBe(1);
    expect(result.stillUndetermined).toBe(0);
    expect(result.reclassified).toEqual([
      {
        transcriptId: 't-1',
        language: 'ru',
        oldDerivedPath: '/derived/lib-1/course-1/lesson.mp4.und.srt',
        newDerivedPath: '/derived/lib-1/course-1/lesson.mp4.ru.srt',
      },
    ]);
    expect(result.errors).toHaveLength(0);
    expect(transcripts.reclassifyGenerated).toHaveBeenCalledWith({
      transcriptId: 't-1',
      oldDerivedPath: '/derived/lib-1/course-1/lesson.mp4.und.srt',
      newDerivedPath: '/derived/lib-1/course-1/lesson.mp4.ru.srt',
      newLanguage: 'ru',
    } satisfies ReclassifyGeneratedInput);
  });

  it('reclassifies an English transcript', async () => {
    const transcripts = makeTranscriptRepo([row({ cueText: ENGLISH_TEXT })]);
    const handler = new BackfillTranscriptLanguageHandler(transcripts, makeAppConfig());

    const result = await handler.execute(new BackfillTranscriptLanguageCommand('und', false));

    expect(result.reclassified[0]?.language).toBe('en');
  });

  it('leaves an ambiguous row und and never calls reclassifyGenerated for it', async () => {
    const transcripts = makeTranscriptRepo([row({ cueText: '42' })]);
    const handler = new BackfillTranscriptLanguageHandler(transcripts, makeAppConfig());

    const result = await handler.execute(new BackfillTranscriptLanguageCommand('und', false));

    expect(result.stillUndetermined).toBe(1);
    expect(result.reclassified).toHaveLength(0);
    expect(transcripts.reclassifyGenerated).not.toHaveBeenCalled();
  });

  it('an ambiguous row is filed under a non-und configured default instead', async () => {
    const transcripts = makeTranscriptRepo([row({ cueText: '42' })]);
    const handler = new BackfillTranscriptLanguageHandler(transcripts, makeAppConfig());

    const result = await handler.execute(new BackfillTranscriptLanguageCommand('en', false));

    expect(result.stillUndetermined).toBe(0);
    expect(result.reclassified[0]?.language).toBe('en');
  });

  it('dry run reports the change but never touches disk or the row', async () => {
    const transcripts = makeTranscriptRepo([row()]);
    const handler = new BackfillTranscriptLanguageHandler(transcripts, makeAppConfig());

    const result = await handler.execute(new BackfillTranscriptLanguageCommand('und', true));

    expect(result.dryRun).toBe(true);
    expect(result.reclassified).toHaveLength(1);
    expect(transcripts.reclassifyGenerated).not.toHaveBeenCalled();
  });

  it('records a per-row error instead of throwing when the derived path escapes', async () => {
    // libraryId fails SAFE_LIBRARY_ID inside derivedTranscriptPath.
    const transcripts = makeTranscriptRepo([
      row({ transcriptId: 't-bad', libraryId: 'not a safe id!' }),
      row({ transcriptId: 't-good' }),
    ]);
    const handler = new BackfillTranscriptLanguageHandler(transcripts, makeAppConfig());

    const result = await handler.execute(new BackfillTranscriptLanguageCommand('und', false));

    expect(result.errors).toEqual([{ transcriptId: 't-bad', message: expect.any(String) }]);
    expect(result.reclassified).toEqual([
      expect.objectContaining({ transcriptId: 't-good', language: 'ru' }),
    ]);
  });
});

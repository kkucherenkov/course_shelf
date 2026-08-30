/**
 * WHY this file exists:
 * Port for the generated transcripts themselves — the rows the run produces, as
 * opposed to the run's own bookkeeping (`transcription.repository.ts`).
 *
 * Two methods, and the shape of each is load-bearing:
 *
 *   - `findGeneratedForLessons` is a batch lookup rather than a per-lesson one.
 *     The walk knows every lesson up front, so the skip rule's input is one
 *     `IN (…)` query instead of one round-trip per lesson.
 *   - `replaceGenerated` writes the transcript and all of its cues in a single
 *     transaction. A half-written transcript would be read back as current by
 *     the next run's skip rule and never repaired.
 *
 * Naming convention:
 *   Token:   TRANSCRIPT_REPOSITORY
 *   Port:    TranscriptRepository (interface)
 *   Adapter: PrismaTranscriptRepository (infra/prisma-transcript.repository.ts)
 */
import type { SubtitleCue } from '../../../../shared/subtitle-converter';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const TRANSCRIPT_REPOSITORY = Symbol('TRANSCRIPT_REPOSITORY');

/**
 * The signature of the video a generated transcript was made from. Exactly the
 * fields `decideTranscription` compares — nothing else is loaded for the walk.
 */
export interface GeneratedTranscriptSignature {
  readonly sourceMtime: Date;
  readonly sourceSize: number;
}

export interface ReplaceGeneratedInput {
  readonly lessonId: string;
  readonly language: string;
  /** Library-relative path of the video the transcript was made from. */
  readonly sourcePath: string;
  readonly sourceMtime: Date;
  readonly sourceSize: number;
  /** Absolute path of the generated `.srt` under DERIVED_PATH. */
  readonly derivedPath: string;
  readonly cues: readonly SubtitleCue[];
}

export interface TranscriptRepository {
  /**
   * Signatures of the generated transcripts these lessons already have in this
   * language, keyed by lesson id. Lessons without one are absent from the map.
   */
  findGeneratedForLessons(
    lessonIds: readonly string[],
    language: string,
  ): Promise<Map<string, GeneratedTranscriptSignature>>;

  /**
   * Replace the generated transcript for `(lessonId, language)` — delete the old
   * row (cues cascade) and insert the new one with its cues, in one transaction.
   */
  replaceGenerated(input: ReplaceGeneratedInput): Promise<void>;
}

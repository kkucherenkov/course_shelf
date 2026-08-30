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
 * `findExisting`/`replaceSidecar`/`deleteForLesson` (E27-F01-S01, E25-F04-S01)
 * serve the scan walk rather than the transcription run:
 *
 *   - `findExisting` is per-lesson, not batched across lessons — the scan
 *     ingests sidecars one lesson at a time (same granularity as its ffprobe
 *     call), and `(lessonId, language)` is the table's unique key, so the
 *     result is a single row rather than a list.
 *   - `replaceSidecar` mirrors `replaceGenerated`'s delete-then-insert shape,
 *     with `origin: sidecar` and no `derivedPath` (the sidecar's own path on
 *     disk is `sourcePath`; nothing is written under DERIVED_PATH for it).
 *   - `deleteForLesson` is scan orphan cleanup: a lesson the scan no longer
 *     finds loses its Transcript rows (both origins), and any `derivedPath`
 *     file is unlinked best-effort — it never touches the Lesson row itself.
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

/** A transcript's origin, mirroring the Prisma `TranscriptOrigin` enum. */
export type TranscriptOriginValue = 'sidecar' | 'generated';

/** What `findExisting` returns for a `(lessonId, language)` pair, if a row exists. */
export interface ExistingTranscriptSignature {
  readonly origin: TranscriptOriginValue;
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

export interface ReplaceSidecarInput {
  readonly lessonId: string;
  readonly language: string;
  /** Library-relative path of the sidecar file itself. */
  readonly sourcePath: string;
  readonly sourceMtime: Date;
  readonly sourceSize: number;
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

  /**
   * The current transcript row for `(lessonId, language)`, of either origin, or
   * null when none exists yet. Drives the scan's re-parse-only-on-change check.
   */
  findExisting(lessonId: string, language: string): Promise<ExistingTranscriptSignature | null>;

  /**
   * Replace the sidecar-origin transcript for `(lessonId, language)` — same
   * delete-then-insert shape as `replaceGenerated`.
   */
  replaceSidecar(input: ReplaceSidecarInput): Promise<void>;

  /**
   * Delete every Transcript row (both origins, all languages) for a lesson the
   * scan no longer finds, unlinking each row's `derivedPath` file best-effort.
   * Never touches the Lesson row.
   */
  deleteForLesson(lessonId: string): Promise<void>;
}

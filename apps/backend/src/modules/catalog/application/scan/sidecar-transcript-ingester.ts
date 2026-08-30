/**
 * WHY this file exists:
 * Turns the sidecar `.srt`/`.vtt` files the scan walk already grouped with a
 * lesson into `Transcript(origin: sidecar)` + `TranscriptCue` rows, so a course
 * that shipped with subtitles is searchable without ever running whisper on it
 * (E27-F01-S01).
 *
 * A plain function rather than an injectable service: both ports it needs
 * (`FsAdapter`, `TranscriptRepository`) are already constructor-injected into
 * `RunScanHandler`, so a class here would exist only to re-inject what the
 * caller already has.
 *
 * Algorithm, per lesson:
 *   1. Dedupe the discovered sidecars by language — same VTT-wins rule
 *      `Subtitle.fromFile` uses, so the Transcript row matches the CC track the
 *      player shows for that language.
 *   2. Per deduped file: look up the current row for `(lessonId, language)`. If
 *      it is already `origin: sidecar` with the same `(mtime, size)`, skip —
 *      no file read. Otherwise read, parse, and replace.
 *   3. A read or parse failure costs that one file: recorded as a ScanError and
 *      returned to the caller, any existing row for the pair is left as-is.
 */
import path from 'node:path';

import { convertSrtToVtt, extractCues } from '../../../../shared/subtitle-converter';
import { dedupeSubtitlePathsByLanguage, languageOf } from '../../domain/lesson/subtitle';

import type { FsAdapter } from '../../domain/scan/fs-adapter';
import type { ScanErrorEntry, ScannedSubtitle } from '../../domain/scan/scan';
import type { TranscriptRepository } from '../../domain/transcription/transcript.repository';

export interface IngestSidecarTranscriptsInput {
  readonly fs: FsAdapter;
  readonly transcripts: TranscriptRepository;
  readonly lessonId: string;
  /** Library root — subtitle paths are recorded library-relative, like `Transcript.sourcePath` elsewhere. */
  readonly rootPath: string;
  readonly subtitles: readonly ScannedSubtitle[];
}

export async function ingestSidecarTranscripts(
  input: IngestSidecarTranscriptsInput,
): Promise<ScanErrorEntry[]> {
  const { fs, transcripts, lessonId, rootPath, subtitles } = input;
  const byPath = new Map(subtitles.map((s) => [s.path, s]));
  const errors: ScanErrorEntry[] = [];

  for (const filePath of dedupeSubtitlePathsByLanguage(subtitles.map((s) => s.path))) {
    const sub = byPath.get(filePath);
    // Unreachable — dedupeSubtitlePathsByLanguage only returns paths it was given.
    if (!sub) continue;

    const language = languageOf(filePath);
    const relativePath = path.relative(rootPath, filePath);

    try {
      const existing = await transcripts.findExisting(lessonId, language);
      const unchanged =
        existing !== null &&
        existing.origin === 'sidecar' &&
        existing.sourceMtime.getTime() === sub.mtime.getTime() &&
        existing.sourceSize === sub.size;
      if (unchanged) continue;

      const raw = await fs.readUtf8(filePath);
      const cues = extractCues(convertSrtToVtt(raw));

      await transcripts.replaceSidecar({
        lessonId,
        language,
        sourcePath: relativePath,
        sourceMtime: sub.mtime,
        sourceSize: sub.size,
        cues,
      });
    } catch (error) {
      errors.push({
        path: relativePath,
        message: error instanceof Error ? error.message : String(error),
        code: 'subtitle-sidecar-invalid',
      });
    }
  }

  return errors;
}

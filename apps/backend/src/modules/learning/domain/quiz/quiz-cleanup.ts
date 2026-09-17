/**
 * WHY this file exists:
 * The cleanup pass (TextModelAdapter.cleanCues) fixes obvious ASR typos before a
 * window feeds question generation — but it is never allowed to change how
 * many cues exist or where they start/end (E29-F02-S01 maintainer
 * clarification #7): the transcript also backs player subtitles, trigram
 * search and `?t=` deep links, so `TranscriptCue` itself is never touched,
 * and a cleanup result that doesn't line up 1:1 with the input is
 * untrustworthy — guessing a correspondence would risk a question citing the
 * wrong timestamp, the one thing the card's acceptance actually requires.
 * This function is the single point that enforces that: same length in, same
 * length out, or the original wins.
 */
import type { SubtitleCue } from '../../../../shared/subtitle-converter';

/**
 * `cleanedTexts` is what the adapter parsed out of the model's response, in
 * cue order — or undefined when cleanup was skipped or the call itself
 * failed. Returns cues with `.text` replaced 1:1 when the count matches the
 * original; otherwise the original cues, untouched (boundaries and count are
 * therefore always preserved by construction).
 */
export function applyCleanup(
  original: readonly SubtitleCue[],
  cleanedTexts: readonly string[] | undefined,
): readonly SubtitleCue[] {
  if (cleanedTexts?.length !== original.length) {
    return original;
  }
  return original.map((cue, i) => ({ ...cue, text: cleanedTexts[i] ?? cue.text }));
}

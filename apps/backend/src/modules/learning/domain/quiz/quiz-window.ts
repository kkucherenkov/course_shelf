/**
 * WHY this file exists:
 * Splits a lesson's cues into bounded windows before any prompt touches them
 * — an hour-long lesson is 8-10k tokens, and feeding that whole transcript in
 * one shot costs an extra ~1-1.5 GB of KV-cache on top of the model's own
 * weights on the maintainer's target NAS (Pentium Gold 8505, 16 GB RAM;
 * E29-F02-S01 design notes). Windowing by character count is a rough proxy
 * for tokens — no tokenizer runs here — budgeted conservatively for Cyrillic,
 * which tends to tokenize less efficiently than Latin script under a BPE
 * vocabulary.
 *
 * A window's start timestamp — its first cue's startMs — becomes every
 * question generated from it: the card's acceptance criterion ("each
 * question carries the timestamp it came from") is satisfied by construction,
 * not by asking the model to report a timestamp it could hallucinate.
 */
import type { SubtitleCue } from '../../../../shared/subtitle-converter';

/**
 * ~2000 tokens at a conservative ~2.5 chars/token for mixed Cyrillic/Latin
 * text — comfortably under a context size that would otherwise add the
 * ~1-1.5 GB of KV-cache a full lesson transcript costs.
 */
export const WINDOW_CHAR_BUDGET = 5000;

export interface QuizWindow {
  readonly startMs: number;
  readonly cues: readonly SubtitleCue[];
}

/**
 * Groups consecutive cues into windows, closing a window once its
 * accumulated text would exceed `charBudget` — never mid-cue, so a window
 * always holds whole cues and can fall back to their original text unchanged
 * if cleanup rejects the model's output. A single cue longer than the budget
 * still gets its own window rather than being split.
 */
export function windowCues(
  cues: readonly SubtitleCue[],
  charBudget: number = WINDOW_CHAR_BUDGET,
): QuizWindow[] {
  const windows: QuizWindow[] = [];
  let current: SubtitleCue[] = [];
  let currentLength = 0;
  let currentStartMs = 0;

  for (const cue of cues) {
    if (current.length > 0 && currentLength + cue.text.length > charBudget) {
      windows.push({ startMs: currentStartMs, cues: current });
      current = [];
      currentLength = 0;
    }
    if (current.length === 0) currentStartMs = cue.startMs;
    current.push(cue);
    currentLength += cue.text.length;
  }
  if (current.length > 0) {
    windows.push({ startMs: currentStartMs, cues: current });
  }
  return windows;
}

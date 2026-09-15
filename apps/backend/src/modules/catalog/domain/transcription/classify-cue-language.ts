/**
 * WHY this file exists:
 * #501 taught `LocalWhisperAdapter` to parse whisper's own detected-language
 * line, but ~1945 `generated` Transcript rows written before that landed are
 * stuck at `language: 'und'` — shown as "Unknown" in the player's CC menu
 * (subtitle.ts). Re-transcribing is weeks of CPU; the cue text is already in
 * the database. This classifies that text instead (#555).
 *
 * Pure function, no I/O — same shape as `resolveDetectedLanguage` (#501),
 * which this reuses rather than duplicating its en/ru restriction: a script
 * calls `classifyTranscriptLanguage`, gets back either `'en'`, `'ru'`, or
 * whatever `defaultLanguage` it was given, never a third language.
 */
import { resolveDetectedLanguage } from './detected-language';

const CYRILLIC_RE = /[Ѐ-ӿ]/g;
const LATIN_RE = /[A-Za-z]/g;

/**
 * Below this many combined Cyrillic+Latin letters, a script majority is not
 * trustworthy — matches `resolveDetectedLanguage`'s own reasoning about a
 * short or noisy clip misdetecting among whisper's ninety-nine languages,
 * applied here to a text-based guess instead of whisper's own.
 */
const MIN_ALPHABETIC_CHARS = 20;

/**
 * Majority script among Cyrillic vs Latin letters in `text`. `undefined` when
 * there are too few alphabetic characters to call it (e.g. a mostly-numeric
 * or music-only track) rather than a low-confidence guess.
 */
export function classifyScript(text: string): 'ru' | 'en' | undefined {
  const cyrillicCount = text.match(CYRILLIC_RE)?.length ?? 0;
  const latinCount = text.match(LATIN_RE)?.length ?? 0;
  if (cyrillicCount + latinCount < MIN_ALPHABETIC_CHARS) return undefined;
  return cyrillicCount > latinCount ? 'ru' : 'en';
}

/**
 * Classifies `cueText` into one of this library's two real languages
 * (`en`/`ru`), falling back to `defaultLanguage` for anything `classifyScript`
 * cannot confidently call.
 */
export function classifyTranscriptLanguage(cueText: string, defaultLanguage: string): string {
  return resolveDetectedLanguage(classifyScript(cueText), defaultLanguage);
}

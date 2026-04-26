/**
 * WHY this file exists:
 * Pure function that converts SubRip (.srt) subtitles to WebVTT (.vtt).
 * No I/O, no side effects — accepts a string, returns a string.
 *
 * Conversion rules:
 *   1. If the input (after BOM + whitespace trim) already starts with `WEBVTT`,
 *      return it unchanged.
 *   2. Strip the UTF-8 BOM (U+FEFF) if present.
 *   3. Normalise line endings to `\n` (handles Windows CRLF and old Mac CR).
 *   4. Drop cue-counter lines: a line containing only digits (optionally
 *      surrounded by whitespace) that immediately precedes a timestamp line is
 *      removed. VTT permits numeric cue IDs but they are optional; removing them
 *      is safe and avoids conflicts with the WEBVTT header numbering.
 *   5. Normalise timestamps: replace the SRT comma decimal separator with a dot
 *      inside `HH:MM:SS,mmm --> HH:MM:SS,mmm` lines.
 *   6. Prepend `WEBVTT\n\n`.
 */

/** UTF-8 BOM character (U+FEFF). */
const BOM = '﻿';

/** Matches `HH:MM:SS,mmm --> HH:MM:SS,mmm` (SRT) or `HH:MM:SS.mmm --> ...` (VTT). */
const TIMESTAMP_LINE_RE = /^\d{2}:\d{2}:\d{2}[,.]?\d{3}\s*-->/;

/** Matches a cue-counter: a line that is ONLY digits (and surrounding spaces). */
const CUE_COUNTER_RE = /^\s*\d+\s*$/;

/** Matches the SRT comma in a timestamp, e.g. `00:00:01,500`. */
const SRT_COMMA_RE = /(\d{2}:\d{2}:\d{2}),(\d{3})/g;

export function convertSrtToVtt(input: string): string {
  // 1. Strip BOM before any other check.
  const stripped = input.startsWith(BOM) ? input.slice(1) : input;

  // 2. Already VTT — return as-is (no further processing).
  if (stripped.trimStart().startsWith('WEBVTT')) {
    return input;
  }

  // 3. Normalise line endings.
  const normalised = stripped.replaceAll('\r\n', '\n').replaceAll('\r', '\n');

  // 4. Remove cue-counter lines.
  //    A cue-counter is a line matching /^\s*\d+\s*$/ whose next non-empty line
  //    is a timestamp. We process line-by-line so we can look ahead.
  const lines = normalised.split('\n');
  const filtered: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (CUE_COUNTER_RE.test(line)) {
      // Find the next non-empty line.
      let j = i + 1;
      while (j < lines.length && (lines[j] ?? '').trim() === '') j++;
      if (j < lines.length && TIMESTAMP_LINE_RE.test(lines[j] ?? '')) {
        // This is a cue counter — skip it.
        continue;
      }
    }
    filtered.push(line);
  }

  // 5. Replace comma decimal separators in timestamp lines.
  const converted = filtered
    .map((line) => {
      if (TIMESTAMP_LINE_RE.test(line)) {
        return line.replaceAll(SRT_COMMA_RE, '$1.$2');
      }
      return line;
    })
    .join('\n');

  // 6. Prepend WEBVTT header, ensuring a blank line between the header and
  //    the first cue block. Trim leading blank lines from the body first so
  //    we always get exactly one blank line after the header.
  const body = converted.trimStart();
  return `WEBVTT\n\n${body}`;
}

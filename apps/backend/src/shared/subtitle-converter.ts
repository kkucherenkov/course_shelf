/**
 * WHY this file exists:
 * Pure subtitle text functions: `convertSrtToVtt` (SubRip → WebVTT) and its
 * inverse-shaped companion `extractCues` (WebVTT → timed cues).
 * No I/O, no side effects — both accept a string and return a value.
 *
 * WHY in src/shared rather than in the streaming module, where the converter
 * started: the streaming controller serves subtitles over the wire and the
 * catalog's transcription run turns whisper's SRT into TranscriptCue rows.
 * `boundaries/element-types` forbids one bounded context importing another, so
 * the shared kernel is the only home both can reach.
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

// ---------------------------------------------------------------------------
// Cue extraction
//
// Lives beside the converter because it shares its timestamp grammar: one place
// to fix when a subtitle dialect surprises us.
// ---------------------------------------------------------------------------

/** One timed line of a transcript. Milliseconds, because that is how it is stored. */
export interface SubtitleCue {
  readonly startMs: number;
  readonly endMs: number;
  readonly text: string;
}

/**
 * Matches a cue timing line, capturing both endpoints.
 *
 * The hour group is optional because WebVTT allows `MM:SS.mmm`, and the decimal
 * separator accepts both `.` and `,` so the function also reads raw SRT — a
 * caller that forgets to convert first gets cues rather than silence. Anything
 * trailing (WebVTT cue settings such as `align:start position:0%`) is ignored.
 */
const CUE_TIMING_RE =
  /^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})\s*-->\s*(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/;

function toMs(
  hours: string | undefined,
  minutes: string,
  seconds: string,
  fraction: string,
): number {
  return (
    Number(hours ?? '0') * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1000 +
    Number(fraction.padEnd(3, '0'))
  );
}

/**
 * Parse a WebVTT (or SRT) document into cues.
 *
 * Pure — no I/O. A line that does not parse as a timing line is skipped rather
 * than throwing: one malformed cue in a six-hour transcript must not cost the
 * whole file. A cue with no text lines is dropped for the same reason.
 */
export function extractCues(vtt: string): SubtitleCue[] {
  const lines = vtt.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n');
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = CUE_TIMING_RE.exec(lines[i] ?? '');
    if (!match) continue;

    // Groups 2/3/4 and 6/7/8 are guaranteed by the regex shape; 1 and 5 (hours)
    // are optional. The `?? '0'` defaults exist only to satisfy noUncheckedIndexedAccess.
    const startMs = toMs(match[1], match[2] ?? '0', match[3] ?? '0', match[4] ?? '0');
    const endMs = toMs(match[5], match[6] ?? '0', match[7] ?? '0', match[8] ?? '0');

    // The payload runs to the blank line that ends the cue (or to EOF, which is
    // why a file with no trailing newline still yields its last cue).
    const text: string[] = [];
    let j = i + 1;
    while (j < lines.length && (lines[j] ?? '').trim() !== '') {
      text.push((lines[j] ?? '').trim());
      j++;
    }
    i = j;

    const joined = text.join('\n').trim();
    if (joined !== '') cues.push({ startMs, endMs, text: joined });
  }

  return cues;
}

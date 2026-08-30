/** Shape of a single `route.query` entry — `vue-router`'s `LocationQueryValue`. */
export type StartTimeQueryValue = string | null | undefined | (string | null)[];

/**
 * Parse the `?t=` deep-link parameter of the lesson player: a start position in
 * seconds. `?t=90` lands on 1:30; this is also what a transcript search result
 * links to.
 *
 * Takes a raw router query value so the caller never has to normalise a
 * repeated parameter — `?t=90&t=5` uses the first occurrence, the same one
 * `URLSearchParams.get` would hand back.
 *
 * Returns `null` for anything that is not a finite, non-negative number, so a
 * junk link falls back to normal resume behaviour instead of seeking to `NaN`.
 */
export function parseStartTime(raw: StartTimeQueryValue): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (trimmed === '') return null;

  // `Number` rather than `parseFloat`: `parseFloat('12abc')` is 12, and a
  // half-parsed timestamp is a worse outcome than ignoring the link.
  const seconds = Number(trimmed);
  if (!Number.isFinite(seconds) || seconds < 0) return null;

  return seconds;
}

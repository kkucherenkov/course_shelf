/**
 * WHY this file exists:
 * Pure domain utility that parses RFC 7233 `Range` request headers into a
 * discriminated union. No I/O, no dependencies — easily unit-tested.
 *
 * The controller pattern-matches on `RangeRequest.kind` and branches into
 * 200 / 206-single / 206-multipart / 416 / 400 responses.
 *
 * Multi-range semantics (RFC 7233 §2.1):
 *   - Parse every comma-separated specifier.
 *   - Drop specifiers whose resolved [start, end] is entirely out of bounds
 *     (start ≥ fileSize).
 *   - If ALL specifiers are OOB → unsatisfiable.
 *   - Post-clamp count 1 → single, >1 → multi.
 */

export type RangeRequest =
  | { kind: 'absent' }
  | { kind: 'invalid' }
  | { kind: 'unsatisfiable' }
  | { kind: 'single'; range: { start: number; end: number } }
  | { kind: 'multi'; ranges: { start: number; end: number }[] };

/**
 * Parse the `Range` HTTP header against the known file size.
 *
 * @param header  Value of the `Range` header, or undefined when the header is absent.
 * @param fileSize  Total number of bytes in the file. Must be > 0.
 */
export function parseRangeHeader(header: string | undefined, fileSize: number): RangeRequest {
  if (header === undefined || header === '') {
    return { kind: 'absent' };
  }

  // RFC 7233 only defines the `bytes` range unit; anything else is invalid.
  if (!header.startsWith('bytes=')) {
    return { kind: 'invalid' };
  }

  const specPart = header.slice('bytes='.length).trim();
  if (specPart === '') {
    return { kind: 'invalid' };
  }

  const specifiers = specPart.split(',');
  const valid: { start: number; end: number }[] = [];

  for (const raw of specifiers) {
    const spec = raw.trim();

    // Suffix form: bytes=-N → last N bytes.
    const suffixMatch = /^-(\d+)$/.exec(spec);
    if (suffixMatch) {
      const suffix = Number.parseInt(suffixMatch[1] ?? '0', 10);
      if (suffix === 0) {
        // bytes=-0 is technically unsatisfiable per the spec; skip this specifier.
        continue;
      }
      const start = Math.max(0, fileSize - suffix);
      const end = fileSize - 1;
      if (start <= end && start < fileSize) {
        valid.push({ start, end });
      }
      continue;
    }

    // Normal and open-ended forms: bytes=START-END or bytes=START-
    const rangeMatch = /^(\d+)-(\d*)$/.exec(spec);
    if (!rangeMatch) {
      return { kind: 'invalid' };
    }

    const start = Number.parseInt(rangeMatch[1] ?? '0', 10);
    const endRaw = rangeMatch[2] ?? '';
    const end = endRaw === '' ? fileSize - 1 : Number.parseInt(endRaw, 10);

    // Malformed: end < start (when end is explicitly given).
    if (endRaw !== '' && end < start) {
      return { kind: 'invalid' };
    }

    // Out of bounds: start is beyond the file.
    if (start >= fileSize) {
      // OOB — skip this specifier; if ALL are OOB we return unsatisfiable below.
      continue;
    }

    // Clamp end to last byte.
    const clampedEnd = Math.min(end, fileSize - 1);
    valid.push({ start, end: clampedEnd });
  }

  if (valid.length === 0) {
    return { kind: 'unsatisfiable' };
  }

  if (valid.length === 1) {
    // valid[0] is always defined here since valid.length === 1
    return { kind: 'single', range: valid[0] as { start: number; end: number } };
  }

  return { kind: 'multi', ranges: valid };
}

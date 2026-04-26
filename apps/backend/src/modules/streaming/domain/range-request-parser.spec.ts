/**
 * Unit tests for parseRangeHeader.
 *
 * Scenarios:
 *   1.  absent header             → kind: 'absent'
 *   2.  bytes=0-499               → kind: 'single', start=0, end=499
 *   3.  bytes=500-                → kind: 'single', start=500, end=fileSize-1
 *   4.  bytes=-100                → kind: 'single', start=fileSize-100, end=fileSize-1
 *   5.  bytes=0-499,1000-1499     → kind: 'multi', two ranges
 *   6.  bytes=999999- (OOB)       → kind: 'unsatisfiable'
 *   7.  pages=0-9 (wrong unit)    → kind: 'invalid'
 *   8.  empty header ''           → kind: 'absent'
 *   9.  bytes=500-200 (end<start) → kind: 'invalid'
 *   10. bytes=0-0 (first byte)    → kind: 'single', start=0, end=0
 *   11. bytes=-0                  → kind: 'unsatisfiable' (suffix 0)
 *   12. bytes=0-99,999999-        → kind: 'single' (only the in-bounds one kept)
 */
import { describe, expect, it } from 'vitest';

import { parseRangeHeader } from './range-request-parser';

const FILE_SIZE = 1024;

describe('parseRangeHeader', () => {
  it('returns absent when header is undefined', () => {
    expect(parseRangeHeader(undefined, FILE_SIZE)).toEqual({ kind: 'absent' });
  });

  it('returns absent when header is empty string', () => {
    expect(parseRangeHeader('', FILE_SIZE)).toEqual({ kind: 'absent' });
  });

  it('returns invalid for wrong range unit (pages=0-9)', () => {
    expect(parseRangeHeader('pages=0-9', FILE_SIZE)).toEqual({ kind: 'invalid' });
  });

  it('returns invalid when end < start (bytes=500-200)', () => {
    expect(parseRangeHeader('bytes=500-200', FILE_SIZE)).toEqual({ kind: 'invalid' });
  });

  it('returns invalid for malformed specifier inside bytes= (bytes=abc)', () => {
    expect(parseRangeHeader('bytes=abc', FILE_SIZE)).toEqual({ kind: 'invalid' });
  });

  it('returns single range for bytes=0-499', () => {
    expect(parseRangeHeader('bytes=0-499', FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: 0, end: 499 },
    });
  });

  it('returns single range for bytes=0-0 (first byte)', () => {
    expect(parseRangeHeader('bytes=0-0', FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: 0, end: 0 },
    });
  });

  it('returns single open-ended range for bytes=500-', () => {
    expect(parseRangeHeader('bytes=500-', FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: 500, end: FILE_SIZE - 1 },
    });
  });

  it('returns single suffix range for bytes=-100', () => {
    expect(parseRangeHeader('bytes=-100', FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: FILE_SIZE - 100, end: FILE_SIZE - 1 },
    });
  });

  it('returns multi range for bytes=0-499,1000-1499 (clamps second to file end)', () => {
    // FILE_SIZE=1024 → second range [1000, 1023] after clamp
    expect(parseRangeHeader('bytes=0-499,1000-1499', FILE_SIZE)).toEqual({
      kind: 'multi',
      ranges: [
        { start: 0, end: 499 },
        { start: 1000, end: 1023 },
      ],
    });
  });

  it('returns unsatisfiable for bytes=999999- (start beyond file size)', () => {
    expect(parseRangeHeader('bytes=999999-', FILE_SIZE)).toEqual({ kind: 'unsatisfiable' });
  });

  it('returns unsatisfiable for bytes=-0 (zero-suffix)', () => {
    expect(parseRangeHeader('bytes=-0', FILE_SIZE)).toEqual({ kind: 'unsatisfiable' });
  });

  it('keeps only the in-bounds specifier when one of two is OOB', () => {
    // bytes=0-99,999999- → only first kept → single
    expect(parseRangeHeader('bytes=0-99,999999-', FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: 0, end: 99 },
    });
  });

  it('clamps end to fileSize-1 when end exceeds file', () => {
    expect(parseRangeHeader(`bytes=0-${FILE_SIZE + 999}`, FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: 0, end: FILE_SIZE - 1 },
    });
  });

  it('suffix larger than file returns start=0', () => {
    expect(parseRangeHeader(`bytes=-${FILE_SIZE + 100}`, FILE_SIZE)).toEqual({
      kind: 'single',
      range: { start: 0, end: FILE_SIZE - 1 },
    });
  });
});

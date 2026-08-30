import { describe, it, expect } from 'vitest';

import { parseStartTime } from './start-time';

describe('parseStartTime', () => {
  it('accepts an integer number of seconds', () => {
    expect(parseStartTime('90')).toBe(90);
  });

  it('accepts a fractional position', () => {
    expect(parseStartTime('12.5')).toBe(12.5);
  });

  it('accepts zero — the start of the lesson is a valid destination', () => {
    expect(parseStartTime('0')).toBe(0);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parseStartTime(' 42 ')).toBe(42);
  });

  it('uses the first occurrence of a repeated query parameter', () => {
    expect(parseStartTime(['90', '5'])).toBe(90);
  });

  it('rejects an empty repeated parameter', () => {
    expect(parseStartTime([])).toBeNull();
    expect(parseStartTime([null])).toBeNull();
  });

  it('rejects a negative position', () => {
    expect(parseStartTime('-1')).toBeNull();
  });

  it('rejects non-numeric values', () => {
    expect(parseStartTime('abc')).toBeNull();
    expect(parseStartTime('12abc')).toBeNull();
    expect(parseStartTime('1:30')).toBeNull();
    expect(parseStartTime('NaN')).toBeNull();
    expect(parseStartTime('Infinity')).toBeNull();
  });

  it('rejects an empty value', () => {
    expect(parseStartTime('')).toBeNull();
    expect(parseStartTime('   ')).toBeNull();
  });

  it('rejects an absent value', () => {
    expect(parseStartTime(undefined)).toBeNull();
    expect(parseStartTime(null)).toBeNull();
  });
});

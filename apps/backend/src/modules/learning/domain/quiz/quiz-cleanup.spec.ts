import { describe, expect, it } from 'vitest';

import { applyCleanup } from './quiz-cleanup';

import type { SubtitleCue } from '../../../../shared/subtitle-converter';

const original: readonly SubtitleCue[] = [
  { startMs: 0, endMs: 1000, text: 'helo wrold' },
  { startMs: 1000, endMs: 2000, text: 'this si a tset' },
];

describe('applyCleanup', () => {
  it('replaces text 1:1 when the cleaned count matches, keeping boundaries', () => {
    const cleaned = applyCleanup(original, ['hello world', 'this is a test']);
    expect(cleaned).toEqual([
      { startMs: 0, endMs: 1000, text: 'hello world' },
      { startMs: 1000, endMs: 2000, text: 'this is a test' },
    ]);
  });

  it('falls back to the original cues, untouched, when the count is short', () => {
    const cleaned = applyCleanup(original, ['only one line']);
    expect(cleaned).toBe(original);
  });

  it('falls back to the original cues, untouched, when the count is long (merged lines split back out)', () => {
    const cleaned = applyCleanup(original, ['a', 'b', 'c']);
    expect(cleaned).toBe(original);
  });

  it('falls back to the original cues when cleanup produced nothing (undefined)', () => {
    const cleaned = applyCleanup(original, undefined);
    expect(cleaned).toBe(original);
  });

  it('never changes cue count or boundaries even on a match — only .text moves', () => {
    const cleaned = applyCleanup(original, ['A', 'B']);
    expect(cleaned).toHaveLength(original.length);
    for (const [i, cue] of cleaned.entries()) {
      expect(cue.startMs).toBe(original[i]!.startMs);
      expect(cue.endMs).toBe(original[i]!.endMs);
    }
  });
});

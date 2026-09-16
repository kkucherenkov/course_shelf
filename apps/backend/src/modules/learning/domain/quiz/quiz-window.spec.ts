import { describe, expect, it } from 'vitest';

import { windowCues } from './quiz-window';

import type { SubtitleCue } from '../../../../shared/subtitle-converter';

function cue(startMs: number, endMs: number, text: string): SubtitleCue {
  return { startMs, endMs, text };
}

describe('windowCues', () => {
  it('returns one window for cues under the budget', () => {
    const cues = [cue(0, 1000, 'hello'), cue(1000, 2000, 'world')];
    const windows = windowCues(cues, 100);
    expect(windows).toHaveLength(1);
    expect(windows[0]!.startMs).toBe(0);
    expect(windows[0]!.cues).toEqual(cues);
  });

  it('starts a new window once the budget would be exceeded', () => {
    const cues = [cue(0, 1000, 'a'.repeat(6)), cue(1000, 2000, 'b'.repeat(6))];
    const windows = windowCues(cues, 10);
    expect(windows).toHaveLength(2);
    expect(windows[0]!.cues).toEqual([cues[0]]);
    expect(windows[1]!.cues).toEqual([cues[1]]);
    expect(windows[1]!.startMs).toBe(1000);
  });

  it('never splits a single cue across windows, even over budget', () => {
    const oversized = cue(0, 1000, 'x'.repeat(50));
    const windows = windowCues([oversized], 10);
    expect(windows).toHaveLength(1);
    expect(windows[0]!.cues).toEqual([oversized]);
  });

  it('returns no windows for an empty cue list', () => {
    expect(windowCues([], 100)).toEqual([]);
  });

  it('every cue from the input appears in exactly one window, in order', () => {
    const cues = Array.from({ length: 20 }, (_, i) => cue(i * 1000, i * 1000 + 900, `line ${i}`));
    const windows = windowCues(cues, 30);
    const flattened = windows.flatMap((w) => w.cues);
    expect(flattened).toEqual(cues);
  });
});

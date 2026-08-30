/**
 * Table-driven spec for decideTranscription.
 *
 * The table is the whole point: the rule is five branches and the only way to
 * be sure `force` does not reach through a sidecar is to state every
 * combination side by side.
 */
import { describe, expect, it } from 'vitest';

import { decideTranscription } from './skip-rule';

import type { TranscriptionDecision, TranscriptionDecisionInput } from './skip-rule';

const MTIME = new Date('2026-08-01T00:00:00.000Z');
const OTHER_MTIME = new Date('2026-08-02T00:00:00.000Z');
const SIZE = 1000;

function input(over: Partial<TranscriptionDecisionInput> = {}): TranscriptionDecisionInput {
  return {
    hasSidecarSubtitle: false,
    existing: null,
    video: { mtime: MTIME, size: SIZE },
    force: false,
    ...over,
  };
}

const CURRENT = { sourceMtime: MTIME, sourceSize: SIZE };
const STALE_MTIME = { sourceMtime: OTHER_MTIME, sourceSize: SIZE };
const STALE_SIZE = { sourceMtime: MTIME, sourceSize: SIZE - 1 };

const CASES: readonly [string, Partial<TranscriptionDecisionInput>, TranscriptionDecision][] = [
  ['nothing exists', {}, 'transcribe'],
  ['a sidecar subtitle exists', { hasSidecarSubtitle: true }, 'skip-sidecar'],
  ['the generated transcript matches the video signature', { existing: CURRENT }, 'skip-current'],
  ['the video mtime moved', { existing: STALE_MTIME }, 'transcribe'],
  ['the video size changed', { existing: STALE_SIZE }, 'transcribe'],
  [
    'force overrides a current generated transcript',
    { existing: CURRENT, force: true },
    'transcribe',
  ],
  [
    'force does not override a hand-made sidecar',
    { hasSidecarSubtitle: true, force: true },
    'skip-sidecar',
  ],
  [
    'a sidecar wins over a stale generated transcript',
    { hasSidecarSubtitle: true, existing: STALE_MTIME },
    'skip-sidecar',
  ],
  ['force with nothing on disk still transcribes', { force: true }, 'transcribe'],
];

describe('decideTranscription', () => {
  it.each(CASES)('%s', (_label, over, expected) => {
    expect(decideTranscription(input(over))).toBe(expected);
  });
});

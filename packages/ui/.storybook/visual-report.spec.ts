import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { parseDiffPercent, recordDrift, resetReport } from './visual-report';

describe('parseDiffPercent', () => {
  it('reads the percentage out of a real jest-image-snapshot message', () => {
    const message =
      'Expected image to match or be a close match to snapshot but was ' +
      '7.4047619047619045% different from snapshot (1234 differing pixels).';
    expect(parseDiffPercent(message)).toBeCloseTo(7.4047619, 5);
  });

  it('reads an integer percentage', () => {
    expect(parseDiffPercent('but was 12% different from snapshot')).toBe(12);
  });

  it.each([
    ['unrelated failure text', 'Snapshot file not found.'],
    ['percentage without the wording', '42%'],
    ['empty message', ''],
  ])('returns null for %s rather than throwing', (_label, message) => {
    // A wording change upstream must degrade the report, not crash the run.
    expect(parseDiffPercent(message)).toBeNull();
  });
});

describe('report file', () => {
  const file = join(tmpdir(), `visual-report-${process.pid}.ndjson`);

  afterEach(() => {
    rmSync(file, { force: true });
  });

  it('appends one JSON object per line', () => {
    resetReport(file);
    recordDrift({ story: 'primitives-appbutton--all-variants', diffPercent: 7.4 }, file);
    recordDrift({ story: 'icons-iconcs--grid', diffPercent: null }, file);

    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => JSON.parse(l))).toEqual([
      { story: 'primitives-appbutton--all-variants', diffPercent: 7.4 },
      { story: 'icons-iconcs--grid', diffPercent: null },
    ]);
  });

  it('drops a stale report so a previous run cannot name healthy stories', () => {
    recordDrift({ story: 'stale--story', diffPercent: 99 }, file);
    resetReport(file);
    recordDrift({ story: 'fresh--story', diffPercent: 1 }, file);

    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string).story).toBe('fresh--story');
  });
});

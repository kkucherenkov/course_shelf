import { readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { parseDiffPercent, recordA11y, recordDrift } from './visual-report';

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
    recordDrift({ story: 'primitives-appbutton--all-variants', diffPercent: 7.4 }, file);
    recordDrift({ story: 'icons-iconcs--grid', diffPercent: null }, file);

    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(lines.map((l) => JSON.parse(l))).toEqual([
      { story: 'primitives-appbutton--all-variants', diffPercent: 7.4 },
      { story: 'icons-iconcs--grid', diffPercent: null },
    ]);
  });

  // Append-only, and truncated by the `test:visual` script rather than by the
  // runner's `setup()` — jest calls `setup()` once per worker, so resetting
  // there deleted entries other workers had already written and the run ended
  // reporting nothing at all.
  it('appends a11y entries without disturbing what is already there', () => {
    recordDrift({ story: 'primitives-appbutton--all-variants', diffPercent: 7.4 }, file);
    recordA11y(
      {
        story: 'domain-applessonrow--stack',
        theme: 'dark',
        rule: 'color-contrast',
        nodes: 4,
        detail: null,
      },
      file,
    );

    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[1] as string)).toEqual({
      story: 'domain-applessonrow--stack',
      theme: 'dark',
      rule: 'color-contrast',
      nodes: 4,
      detail: null,
    });
  });
});

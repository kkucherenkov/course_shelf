// openapi-validator.middleware.spec.ts
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { pickNewestSpec } from './openapi-validator.middleware';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(os.tmpdir(), 'openapi-spec-resolution-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(name: string, ageSeconds: number): string {
  const file = path.join(dir, name);
  writeFileSync(file, '{}');
  const mtime = new Date(Date.now() - ageSeconds * 1000);
  utimesSync(file, mtime, mtime);
  return file;
}

describe('pickNewestSpec', () => {
  it('returns null when no candidate exists', () => {
    expect(pickNewestSpec([path.join(dir, 'nope.json')])).toBeNull();
  });

  it('picks the sole existing candidate', () => {
    const spec = write('spec.json', 0);
    expect(pickNewestSpec([path.join(dir, 'missing.json'), spec])).toEqual({
      specPath: spec,
      stale: [],
    });
  });

  it('prefers the freshest file over one that merely comes first in priority order', () => {
    // #500: a stale build artefact used to win just because it was listed
    // first, regardless of which spec was actually bundled most recently.
    const staleBuiltCopy = write('dist-spec.json', 600); // 10 minutes old
    const freshBundle = write('bundle-spec.json', 0);

    const result = pickNewestSpec([staleBuiltCopy, freshBundle]);
    expect(result?.specPath).toBe(freshBundle);
    expect(result?.stale).toEqual([staleBuiltCopy]);
  });

  it('keeps candidate order as the tiebreaker when mtimes are equal', () => {
    const first = path.join(dir, 'first.json');
    const second = path.join(dir, 'second.json');
    const tied = new Date();
    writeFileSync(first, '{}');
    writeFileSync(second, '{}');
    utimesSync(first, tied, tied);
    utimesSync(second, tied, tied);

    const result = pickNewestSpec([first, second]);
    expect(result?.specPath).toBe(first);
    expect(result?.stale).toEqual([second]);
  });
});

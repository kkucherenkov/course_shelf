/**
 * Unit tests for the shared library-registration rules.
 *
 * The first block is the anti-drift gate: `ROOT_PATH_PATTERN` is a hand-copied
 * mirror of the OpenAPI document's `RegisterLibraryRequest.rootPath.pattern`,
 * so the test reads the pattern back out of the spec and compares. If the spec
 * changes, this fails here rather than on a user's NAS.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import en from '../../i18n/locales/en';
import ru from '../../i18n/locales/ru';

import {
  ROOT_PATH_PATTERN,
  isAbsoluteRootPath,
  normalizeRootPath,
  problemDetail,
} from './library-register';

const BACKSLASH = String.fromCodePoint(92);
const NUL = String.fromCodePoint(0);
const ZWSP = String.fromCodePoint(0x20_0b);
const BOM = String.fromCodePoint(0xfe_ff);

/** The `rootPath` pattern as written in `packages/specs/openapi/openapi.yaml`. */
function patternFromSpec(): string {
  // Vitest's root is `apps/web` (see vitest.config.ts), and `import.meta.url`
  // is not a file: URL under vite-node.
  const specPath = path.resolve(process.cwd(), '../../packages/specs/openapi/openapi.yaml');
  const doc = readFileSync(specPath, 'utf8');
  const schema = doc.slice(doc.indexOf('    RegisterLibraryRequest:'));
  const rootPath = schema.slice(schema.indexOf('        rootPath:'));
  const line = /^\s*pattern: '(.+)'$/m.exec(rootPath);
  if (!line?.[1]) throw new Error('rootPath pattern not found in openapi.yaml');
  return line[1];
}

describe('ROOT_PATH_PATTERN', () => {
  it('is character-for-character the spec pattern', () => {
    // Two purely notational differences: a regex literal escapes `/`, and the
    // spec writes NUL the JSON-Schema way. Everything else must match exactly.
    const mirrored = ROOT_PATH_PATTERN.source
      .replace(BACKSLASH + '/', '/')
      .replace(BACKSLASH + 'u0000', BACKSLASH + 'x00');

    expect(mirrored).toBe(patternFromSpec());
  });

  it('agrees with the spec pattern on every sample', () => {
    const fromSpec = new RegExp(patternFromSpec());
    const samples = [
      '/data/courses',
      '/',
      '/mnt/nas/Обучение/',
      'C:' + BACKSLASH + 'courses',
      'z:' + BACKSLASH,
      'data/courses',
      './data',
      '~/courses',
      '',
      ' /data/courses',
      'C:/courses',
      '/data' + NUL + '/courses',
      ZWSP + '/data/courses',
    ];

    for (const sample of samples) {
      expect([sample, ROOT_PATH_PATTERN.test(sample)]).toStrictEqual([
        sample,
        fromSpec.test(sample),
      ]);
    }
  });
});

describe('isAbsoluteRootPath', () => {
  it('accepts POSIX and Windows absolute paths', () => {
    expect(isAbsoluteRootPath('/srv/courses')).toBe(true);
    expect(isAbsoluteRootPath('C:' + BACKSLASH + 'courses')).toBe(true);
  });

  it('rejects the relative paths that made the server answer 400', () => {
    expect(isAbsoluteRootPath('data/courses')).toBe(false);
    expect(isAbsoluteRootPath('volume1/courses')).toBe(false);
    expect(isAbsoluteRootPath('')).toBe(false);
  });

  it('rejects a NUL-bearing path', () => {
    expect(isAbsoluteRootPath('/srv' + NUL + '/courses')).toBe(false);
  });
});

describe('normalizeRootPath', () => {
  it('trims ordinary whitespace', () => {
    expect(normalizeRootPath('  /srv/courses \t')).toBe('/srv/courses');
  });

  it('strips the zero-width characters String.trim() leaves behind', () => {
    // The pasted-path case: invisible, and it breaks the leading-slash anchor.
    const pasted = ZWSP + ' /srv/courses' + BOM;
    expect(pasted.trim().startsWith('/')).toBe(false);
    expect(normalizeRootPath(pasted)).toBe('/srv/courses');
    expect(isAbsoluteRootPath(normalizeRootPath(pasted))).toBe(true);
  });

  it('leaves the interior of a path alone', () => {
    // Rewriting the middle would register a directory other than the one shown.
    const interior = '/srv/' + ZWSP + 'courses';
    expect(normalizeRootPath(interior)).toBe(interior);
  });
});

describe('locale copy', () => {
  // `Library.register` checks a non-empty name and an absolute path, and never
  // touches the filesystem. A string telling the operator to check that the
  // path exists sends them looking at a directory that was never the problem —
  // which is exactly how this bug cost an evening.
  it.each([
    ['en', en],
    ['ru', ru],
  ])('does not claim the server verified the path exists (%s)', (_locale, messages) => {
    const copy = JSON.stringify(messages);
    expect(copy).not.toMatch(/exists on the server/i);
    expect(copy).not.toMatch(/существует на сервере/i);
  });
});

describe('problemDetail', () => {
  it('prefers detail, the field that names the offending value', () => {
    expect(
      problemDetail({ title: 'Bad Request', status: 400, detail: 'rootPath must be absolute' }),
    ).toBe('rootPath must be absolute');
  });

  it('falls back to title when the server sent no detail', () => {
    expect(problemDetail({ title: 'Bad Request', status: 400 })).toBe('Bad Request');
  });

  it('returns null when there is no problem document at all', () => {
    expect(problemDetail(null)).toBeNull();
    expect(problemDetail(undefined)).toBeNull();
    expect(problemDetail('Failed to fetch')).toBeNull();
  });
});

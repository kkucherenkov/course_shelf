/**
 * WHY this file exists:
 * `Content-Disposition` is the one place an export touches a header, and a
 * header may only carry latin1. A Cyrillic course title used to 500 the whole
 * export (#790) — 32 of the 68 courses in the production dump — and the gate
 * ran green over it because `seed-catalog.ts` produces Latin titles and both
 * controller assertions used `intro.zip` and `signals.zip`.
 *
 * So the cases below are chosen by script, not by shape: pure ASCII, pure
 * non-ASCII, and mixed. The header these produce must stay inside ASCII no
 * matter what a future `slugifyForFilename` decides to keep.
 */
import { describe, expect, it } from 'vitest';

import { contentDisposition } from './zip-writer';

const HEADER_UNSAFE = /[^\u0020-\u007E]/u;

describe('contentDisposition', () => {
  it('sends a pure-ASCII name in both parameters', () => {
    expect(contentDisposition('intro.zip')).toBe(
      'attachment; filename="intro.zip"; filename*=UTF-8\'\'intro.zip',
    );
  });

  it('percent-encodes a Cyrillic name and falls back to a generic ASCII one', () => {
    const header = contentDisposition('физика-на-кончиках-пальцев.zip');

    expect(header).toContain('filename="export.zip"');
    expect(header).toContain(
      "filename*=UTF-8''%D1%84%D0%B8%D0%B7%D0%B8%D0%BA%D0%B0-%D0%BD%D0%B0-%D0%BA%D0%BE%D0%BD%D1%87%D0%B8%D0%BA%D0%B0%D1%85-%D0%BF%D0%B0%D0%BB%D1%8C%D1%86%D0%B5%D0%B2.zip",
    );
  });

  it('keeps the Latin part of a mixed-script name in the fallback', () => {
    const header = contentDisposition('vue-3-курс.zip');

    expect(header).toContain('filename="vue-3.zip"');
    expect(header).toContain("filename*=UTF-8''vue-3-%D0%BA%D1%83%D1%80%D1%81.zip");
  });

  // The regression itself: Node throws ERR_INVALID_CHAR on a header byte
  // outside latin1, so this assertion is the one that would have caught #790.
  it.each([
    'intro.zip',
    'физика-на-кончиках-пальцев.zip',
    'vue-3-курс.zip',
    '日本語のコース.zip',
    'ελληνικά.zip',
  ])('produces a header free of non-ASCII bytes for %s', (filename) => {
    expect(contentDisposition(filename)).not.toMatch(HEADER_UNSAFE);
  });

  it('never emits a bare extension when nothing ASCII survives', () => {
    expect(contentDisposition('日本語のコース.zip')).toContain('filename="export.zip"');
  });

  it('strips quoted-string metacharacters that would break out of the parameter', () => {
    const header = contentDisposition(String.raw`a"b\c.zip`);

    expect(header).toContain('filename="abc.zip"');
    expect(header).not.toMatch(/filename="[^"]*["\\][^"]*"/u);
  });
});

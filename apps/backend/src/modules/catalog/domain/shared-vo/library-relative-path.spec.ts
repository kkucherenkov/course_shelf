/**
 * Unit tests for LibraryRelativePath.
 *
 * The bug this VO fixes (#554): `run-scan.handler.ts` stored `Lesson.videoPath`
 * absolute while every reader treated it as library-relative. Both readings
 * compiled — the field was a raw `string` — so a future write site could
 * regress silently. These tests cover the normalisation `from()` performs
 * (absolute-in, relative-out) and the guard both constructors share.
 */
import { describe, expect, it } from 'vitest';

import { LibraryRelativePath } from './library-relative-path';
import { LibraryRelativePathEscapedError } from './shared.errors';

describe('LibraryRelativePath.from', () => {
  it('normalises an absolute path under the root to library-relative', () => {
    const vo = LibraryRelativePath.from('/lib/course/01 - Intro.mp4', '/lib');
    expect(vo.value).toBe('course/01 - Intro.mp4');
  });

  it('leaves an already-relative path unchanged', () => {
    const vo = LibraryRelativePath.from('course/01 - Intro.mp4', '/lib');
    expect(vo.value).toBe('course/01 - Intro.mp4');
  });

  it('collapses a traversing-but-still-inside relative path', () => {
    const vo = LibraryRelativePath.from('course/../course/01 - Intro.mp4', '/lib');
    expect(vo.value).toBe('course/01 - Intro.mp4');
  });

  it('throws when an absolute path is outside the library root', () => {
    expect(() => LibraryRelativePath.from('/etc/passwd', '/lib')).toThrow(
      LibraryRelativePathEscapedError,
    );
  });

  it('throws when a relative path traverses above the library root', () => {
    expect(() => LibraryRelativePath.from('../etc/passwd', '/lib')).toThrow(
      LibraryRelativePathEscapedError,
    );
  });

  it('throws when the path resolves to the root itself (empty relative value)', () => {
    expect(() => LibraryRelativePath.from('/lib', '/lib')).toThrow(LibraryRelativePathEscapedError);
  });
});

describe('LibraryRelativePath.reconstitute', () => {
  it('trusts an already-relative persisted value', () => {
    const vo = LibraryRelativePath.reconstitute('course/01 - Intro.mp4');
    expect(vo.value).toBe('course/01 - Intro.mp4');
  });

  it('throws on an absolute value — a persisted row must never carry one', () => {
    expect(() => LibraryRelativePath.reconstitute('/lib/course/01 - Intro.mp4')).toThrow(
      LibraryRelativePathEscapedError,
    );
  });

  it('throws on a `..`-traversing value', () => {
    expect(() => LibraryRelativePath.reconstitute('../etc/passwd')).toThrow(
      LibraryRelativePathEscapedError,
    );
  });

  it('throws on an empty value', () => {
    expect(() => LibraryRelativePath.reconstitute('')).toThrow(LibraryRelativePathEscapedError);
  });
});

describe('resolveAbsolute', () => {
  it('resolves back to the original absolute path under the same root', () => {
    const vo = LibraryRelativePath.from('/lib/course/01 - Intro.mp4', '/lib');
    expect(vo.resolveAbsolute('/lib')).toBe('/lib/course/01 - Intro.mp4');
  });

  it('resolves under a different root — the value carries no root baked in', () => {
    const vo = LibraryRelativePath.from('/lib/course/01 - Intro.mp4', '/lib');
    expect(vo.resolveAbsolute('/mnt/moved-library')).toBe(
      '/mnt/moved-library/course/01 - Intro.mp4',
    );
  });
});

describe('equals / toString', () => {
  it('two instances built from the same normalised value are equal', () => {
    const a = LibraryRelativePath.from('/lib/course/a.mp4', '/lib');
    const b = LibraryRelativePath.reconstitute('course/a.mp4');
    expect(a.equals(b)).toBe(true);
    expect(a.toString()).toBe('course/a.mp4');
  });
});

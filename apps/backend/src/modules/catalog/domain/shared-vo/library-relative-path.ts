/**
 * WHY this file exists:
 * `Lesson.videoPath` was written absolute by the scan walk (`videoFile.path`,
 * straight off `FsAdapter.walk`) while every reader — `derived-path.ts`,
 * `lesson-file-locator.ts`, this module's own doc comments — treated it as
 * library-relative. Both readings compiled fine because the field was a raw
 * `string`; nothing stopped a future write site from making the same mistake
 * again. `LibraryRelativePath` is the fix: the convention lives in a type, so
 * constructing one from an absolute path outside the library root is the only
 * way left to get it wrong, and that throws.
 *
 * Two constructors, mirroring why `Subtitle` has `fromFile`/`reconstitute`:
 *   - `from(raw, libraryRoot)` — the write side. Normalises an absolute OR
 *     relative `raw` against `libraryRoot` into the relative form. Used by
 *     the scan walk, which still works in absolute-path space internally
 *     (same as `Material`/`Subtitle`'s own paths — out of this VO's scope)
 *     and only needs the conversion at the `Lesson.create()` boundary.
 *   - `reconstitute(value)` — the read side. Trusts a persisted row's value
 *     as already relative; still rejects an absolute-looking string, because
 *     after the migration that shipped alongside this VO no row should ever
 *     produce one again, and silently accepting one would put the bug back.
 */
import path from 'node:path';

import { LibraryRelativePathEscapedError } from './shared.errors';

export class LibraryRelativePath {
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Normalise `raw` (absolute or already-relative, forward or back slashes)
   * against `libraryRoot`.
   *
   * @throws LibraryRelativePathEscapedError when the normalised result would
   *   land outside `libraryRoot` (an absolute path from a different root, or
   *   a `..`-traversing relative one).
   */
  static from(raw: string, libraryRoot: string): LibraryRelativePath {
    const root = path.resolve(libraryRoot);
    const resolved = path.resolve(root, raw);
    const relative = path.relative(root, resolved);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new LibraryRelativePathEscapedError(raw);
    }
    return new LibraryRelativePath(relative);
  }

  /**
   * Reconstitute a value already known to be library-relative — a persisted
   * row. Rejects an absolute-looking or traversing value defensively; a
   * persisted row should never carry one once every write site goes through
   * `from()`.
   *
   * @throws LibraryRelativePathEscapedError when `value` is empty, absolute,
   *   or contains a `..` segment.
   */
  static reconstitute(value: string): LibraryRelativePath {
    const segments = value.split(/[/\\]/);
    if (value === '' || path.isAbsolute(value) || segments.includes('..')) {
      throw new LibraryRelativePathEscapedError(value);
    }
    return new LibraryRelativePath(value);
  }

  /** Absolute path of this value under `libraryRoot`. */
  resolveAbsolute(libraryRoot: string): string {
    return path.resolve(libraryRoot, this.value);
  }

  /** Structural equality — two instances with the same relative value are equal. */
  equals(other: LibraryRelativePath): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

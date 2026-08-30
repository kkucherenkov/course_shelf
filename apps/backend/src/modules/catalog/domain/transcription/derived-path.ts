/**
 * WHY this file exists:
 * The single place that knows how a lesson's library-relative video path maps
 * to the path of its generated transcript under DERIVED_PATH, and the single
 * place that enforces the traversal-protection invariant for that root.
 *
 * The guard is deliberately a SECOND, SEPARATE implementation from the one in
 * `streaming/domain/lesson-file-locator.ts` rather than a shared resolver
 * parameterised by root: one resolver that accepts either root is one resolver
 * that can be talked into the wrong one. The library root is read-only in
 * production and the derived root is writable, so the two guards protect
 * opposite guarantees and must not share a code path.
 *
 * Layout (design §4):
 *   <derivedRoot>/<libraryId>/<library-relative video path>.<lang>.srt
 */
import path from 'node:path';

import { DerivedPathEscapedError } from './transcription.errors';

export interface DerivedTranscriptPathInput {
  readonly derivedRoot: string;
  readonly libraryId: string;
  /** Library-relative video path, exactly as stored on `Lesson.videoPath`. */
  readonly videoPath: string;
  readonly language: string;
}

/** Language tags are short ASCII; anything else is a path-injection attempt. */
const SAFE_LANGUAGE = /^[A-Za-z0-9_-]{1,16}$/;

/** cuid/uuid-shaped ids only — a library id is never a path fragment. */
const SAFE_LIBRARY_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Absolute path of the generated `.srt` for one lesson in one language.
 *
 * @throws DerivedPathEscapedError when the result would land outside
 *   `<derivedRoot>/<libraryId>` — an absolute or traversing `videoPath`, or a
 *   crafted `language` / `libraryId`.
 */
export function derivedTranscriptPath(input: DerivedTranscriptPathInput): string {
  const { derivedRoot, libraryId, videoPath, language } = input;

  if (!SAFE_LANGUAGE.test(language)) {
    throw new DerivedPathEscapedError(`language: ${language}`);
  }
  if (!SAFE_LIBRARY_ID.test(libraryId)) {
    throw new DerivedPathEscapedError(`libraryId: ${libraryId}`);
  }

  const libraryRoot = path.resolve(derivedRoot, libraryId);
  const resolved = path.resolve(libraryRoot, `${videoPath}.${language}.srt`);

  // The empty case (`resolved === libraryRoot`) is unreachable while the name
  // always carries a `.srt` suffix; it stays as a fail-closed guard in case a
  // future caller passes a suffix-free base path.
  const relative = path.relative(libraryRoot, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new DerivedPathEscapedError(resolved);
  }

  return resolved;
}

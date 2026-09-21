/**
 * WHY this file exists:
 * Decides which folder of a course tree is a SECTION, and in what order the
 * sections run. The scan used to answer the first question with
 * `relSegments[0]` — the first folder below the course, always — so anything
 * nested deeper was folded into it.
 *
 * Measured on the maintainer's library (5973 lessons, 68 courses, 2026-09-21):
 * 736 lessons (12.3 %) sit deeper than `course/section/file`, and 13 sections
 * held 371 lessons that belong to several real subsections. The worst case is
 * a six-week bass course whose weeks each open with `00 - Introduction`:
 * folded into one section and ordered by the file ordinal, the course opened
 * with all six introductions back to back.
 *
 * The rule, and why it is "more than one video" rather than the path depth:
 *
 *   A folder holding EXACTLY ONE video is a lesson folder — the Udemy-style
 *   layout where a lesson gets its own directory for slides and exercises.
 *   Turning those into sections would have produced 49 wrong splits in the
 *   same library (a 31-lesson chess course would have become 31 sections of
 *   one lesson each). A folder holding SEVERAL videos is a section.
 *
 * The rule never climbs above the first folder below the course, so a course
 * whose lessons each have their own directory keeps the sections it has today.
 * Known ceiling: at depth 4+ a lesson folder resolves to the first segment
 * rather than to its own parent — 5 lessons in the measured library, and
 * splitting them needs a video count for a directory's whole subtree rather
 * than for its immediate children.
 */

/** Separator used by both the POSIX and Windows paths the walk produces. */
const SEPARATOR = /[/\\]/;

export interface SectionFolderInput {
  /** Path segments from the course folder down to and including the filename. */
  readonly relSegments: readonly string[];
  /**
   * How many videos sit DIRECTLY in a directory, keyed by the directory's
   * course-relative path (segments joined with `/`). Callers build this from
   * the stem groups, so a directory holding one video and ten PDFs counts 1.
   */
  readonly videoCountByDir: ReadonlyMap<string, number>;
}

/**
 * The course-relative folder that owns this lesson as a section, or
 * `undefined` when the lesson sits directly in the course folder (flat
 * layout — the caller substitutes its synthetic "Lessons" section).
 */
export function resolveSectionFolder({
  relSegments,
  videoCountByDir,
}: SectionFolderInput): string | undefined {
  if (relSegments.length <= 1) return undefined;

  const first = relSegments[0] ?? '';
  const ownDirSegments = relSegments.slice(0, -1);
  if (ownDirSegments.length === 1) return first;

  const ownDir = ownDirSegments.join('/');
  return (videoCountByDir.get(ownDir) ?? 0) > 1 ? ownDir : first;
}

/**
 * Sort key for a section folder: the parsed ordinal of every path segment.
 *
 * Comparing only the deepest segment reads `06 Go на Практике/11 Как Писать
 * Тесты` as 11 and drops it between the course's sections 10 and 12. Composed,
 * it is `[6, 11]`, which sorts before `[8]` where it belongs — the same
 * reasoning `lesson-position.ts` applies to composite `N.M` filenames.
 *
 * A segment with no ordinal contributes `Infinity` so unnumbered folders sort
 * after numbered siblings, matching the pre-existing section-order rule.
 */
export function sectionSortKey(
  relFolder: string,
  parseOrdinal: (segment: string) => number | undefined,
): number[] {
  return relFolder
    .split(SEPARATOR)
    .map((segment) => parseOrdinal(segment) ?? Number.POSITIVE_INFINITY);
}

/**
 * Compares two section keys element by element.
 *
 * A missing element counts as `-Infinity`, not `Infinity`: `[6]` is the folder
 * `06 - Practice` itself, which holds videos of its own and must come before
 * its subsection `[6, 11]`.
 */
export function compareSectionKeys(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? Number.NEGATIVE_INFINITY;
    const y = b[i] ?? Number.NEGATIVE_INFINITY;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

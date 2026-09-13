/**
 * WHY this file exists:
 * Assigns 1-based lesson positions within a section as a batch, not per-file.
 * Fixes the E32-F01-S01 data loss (lesson-loss-report.md): the pre-fix
 * handler computed `lessonPosition = parsed.ordinal ?? 1` per file, so any
 * two files in the same section that shared an ordinal (or, more often,
 * parsed no ordinal at all) landed on the same position — the second write
 * then lost the `(sectionId, position)` unique-constraint race and the
 * lesson silently vanished (see `Lesson`'s WHY comment and
 * `PrismaLessonRepository.save`'s P2002 → LessonPositionConflictError).
 *
 * The position rule, decided deliberately:
 *   1. Preferred order key — the parsed ordinal, composed with
 *      `sectionOrdinal` when the filename is a composite "N.M" pattern
 *      (`10.1`, `10.2`, `11.1`, …). Composing matters: a flat course folder
 *      that numbers lessons "chapter.lesson" repeats the lesson number in
 *      every chapter (`10.1` and `11.1` both have ordinal=1) — using the
 *      ordinal alone is exactly the collision that dropped 112 of 128
 *      lessons in "Основы Golang". Composing (sectionOrdinal, ordinal) into
 *      one sortable key orders by chapter-then-lesson instead.
 *   2. Fallback — the full videoPath, lexicographically. Used whenever no
 *      ordinal parses (or two entries tie on their composed key). It is
 *      deterministic and stable across rescans because a file's absolute
 *      path does not change while its content is unchanged — unlike
 *      relying on `FsAdapter.walk()`'s enumeration order, which is not
 *      guaranteed stable across two directory listings on every filesystem.
 *   3. The emitted position is always the 1-based RANK in this order, never
 *      the sort key itself: the UI renders `lesson.position` directly as the
 *      lesson number (`CourseSectionsList.vue`, `:num="lesson.position"`),
 *      so it must stay a small sequential integer. Ranking also makes
 *      collisions structurally impossible — N entries always produce N
 *      distinct positions, 1..N.
 *
 * A DB-level (sectionId, position) conflict can therefore only mean an
 * unexpected bug elsewhere (not a naming-convention collision); that path
 * stays wired through `LessonPositionConflictError` → a `lesson-persist-failed`
 * ScanError in `RunScanHandler`, never a silent overwrite.
 */
import type { ParsedLessonFileName } from './folder-name.parser';

export interface LessonPositionInput {
  readonly videoPath: string;
  readonly parsed: ParsedLessonFileName;
}

/** Sort key used to approximate the author's intended order before ranking. */
function sortKey(parsed: ParsedLessonFileName): number {
  if (parsed.sectionOrdinal !== undefined && parsed.ordinal !== undefined) {
    return parsed.sectionOrdinal * 1_000_000 + parsed.ordinal;
  }
  return parsed.ordinal ?? Number.POSITIVE_INFINITY;
}

/**
 * Assigns 1-based positions to every entry, scoped to a single section.
 * Callers must group entries by sectionId before calling this — positions
 * are unique only within one call's input, by construction (rank order).
 */
export function assignLessonPositions(
  entries: readonly LessonPositionInput[],
): Map<string, number> {
  const sorted = entries.toSorted((a, b) => {
    const diff = sortKey(a.parsed) - sortKey(b.parsed);
    if (diff !== 0) return diff;
    return a.videoPath.localeCompare(b.videoPath);
  });

  const positions = new Map<string, number>();
  for (const [index, entry] of sorted.entries()) {
    positions.set(entry.videoPath, index + 1);
  }
  return positions;
}

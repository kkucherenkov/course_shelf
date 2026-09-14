/**
 * WHY this file exists:
 * Domain port (interface + Symbol token) for Lesson persistence. The application
 * layer depends only on this interface; the Prisma adapter in infra/ implements
 * it and is bound via the token in CatalogModule.
 *
 * All read methods return aggregates with materials + subtitles eagerly loaded.
 */
import type { Lesson } from './lesson';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const LESSON_REPOSITORY = Symbol('LESSON_REPOSITORY');

export interface LessonRepository {
  /**
   * Persist the aggregate atomically (lesson row + nested material + subtitle rows).
   *
   * Throws LessonPositionConflictError when the (sectionId, position) unique
   * constraint is violated (Prisma P2002 → translated in the adapter).
   */
  save(lesson: Lesson): Promise<void>;

  /**
   * Return the aggregate by id with materials + subtitles eagerly loaded.
   * Returns null when not found.
   */
  findById(id: string): Promise<Lesson | null>;

  /**
   * Return all lessons for a given course with materials + subtitles eagerly loaded.
   * Ordered by (sectionId, position) asc.
   */
  findByCourse(courseId: string): Promise<Lesson[]>;

  /**
   * Return all lessons for a given section with materials + subtitles eagerly loaded.
   * Ordered by position asc.
   */
  findBySection(sectionId: string): Promise<Lesson[]>;

  /**
   * Force-resync only (E32-F01-S03): move every lesson position of this course
   * far into the negative range, in one statement, before the walk writes the
   * new positions back one lesson at a time.
   *
   * WHY: a resync that inserts a lesson the first import missed shifts every
   * later lesson in that section down one. Saving them one at a time means a
   * lesson lands on a position the row after it still holds — the
   * `(sectionId, position)` unique violation that E32-F01-S01 traced lesson
   * loss to. Parking first empties the whole positive range for this course.
   *
   * The shift is uniform, so it cannot collide with itself: adding a constant
   * to every row keeps them distinct. Callers MUST write every surviving
   * lesson back afterwards — a row left parked reads as a negative lesson
   * number in the UI until the next resync repairs it.
   *
   * Ceiling: each park shifts by a fixed offset, so a course parked ~2000
   * times without ever being written back would underflow `Int`. A resync
   * always writes back, and the next one starts from positive positions again.
   */
  parkPositionsForResync(courseId: string): Promise<void>;

  /**
   * Delete these lessons and every row that references `lessonId` without a
   * foreign key to hold it: `LessonProgress`, `Bookmark`, `Note`. Materials
   * and subtitles cascade with the lesson row.
   *
   * `Transcript` (and its cues) is deliberately NOT deleted here —
   * `TranscriptRepository.deleteForLesson` owns it, because it also unlinks
   * the generated file. Call that first: a transcript that outlives its lesson
   * keeps its cues in the `pg_trgm` index E27 search reads, so search would
   * return hits pointing at a lesson that no longer exists.
   */
  removeMany(lessonIds: readonly string[]): Promise<void>;

  /**
   * Return aggregate lesson stats (count + total duration) for a set of course
   * ids in a single query. Missing courses (no lessons) are absent from the result
   * map — callers must handle missing entries as { lessonCount: 0, totalDurationSeconds: 0 }.
   * Null lesson.duration values are treated as 0.
   *
   * Added for the recently-added home-row query handler (E14-F01-S01).
   */
  getLessonStatsByCourseIds(
    courseIds: string[],
  ): Promise<Map<string, { lessonCount: number; totalDurationSeconds: number }>>;

  /**
   * Which of these lesson ids currently exist, as a Set. One batch query
   * rather than an exists() per id — used to verify a denormalised reference
   * (e.g. `CourseProgressReadModel.lastSeenLessonId`) still points at a real
   * row before it is returned over the wire (#497): a scoped rescan can
   * delete a lesson without touching that projection field, unlike
   * `lessonsTotal`/`percent`, which self-heal on the next progress event.
   */
  existsByIds(ids: readonly string[]): Promise<Set<string>>;
}

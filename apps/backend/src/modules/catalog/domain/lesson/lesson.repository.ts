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
}

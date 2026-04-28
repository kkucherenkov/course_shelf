/**
 * WHY this file exists:
 * Port (interface + injection token) for the LessonProgress persistence adapter.
 * The application layer depends only on this contract; the Prisma adapter in
 * infra/ implements it. Swapping storage never touches domain or application code.
 */
import type { LessonProgress } from './lesson-progress';

export interface LessonProgressRepository {
  save(progress: LessonProgress): Promise<void>;
  findByUserAndLesson(userId: string, lessonId: string): Promise<LessonProgress | null>;

  /**
   * Count lessons completed (completed = true) by a user within a course.
   * Used by event handlers to keep lessonsCompleted in sync on the
   * CourseProgressReadModel projection.
   */
  countCompletedByUserAndCourse(userId: string, courseId: string): Promise<number>;

  /**
   * Return every distinct (userId, courseId) pair that has at least one
   * LessonProgress row. Used by the rebuild-projections script to enumerate
   * all (user, course) combinations that need a projection row.
   */
  findAllUserCoursePairs(): Promise<{ userId: string; courseId: string }[]>;

  /**
   * Return the most recent LessonProgress row for a (userId, courseId) pair
   * — i.e. the row with the highest lastSeenAt. Returns null when no rows exist.
   * Used by the rebuild-projections service to determine lastSeenLessonId.
   */
  findLatestByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<{ lessonId: string; lastSeenAt: Date } | null>;

  /**
   * Compute the "your week" stats for a user over a half-open time window [from, to).
   *
   * minutesWatched: SUM(positionSeconds) of rows whose updatedAt falls in the
   * window, divided by 60 and floored. positionSeconds represents elapsed/watched
   * time (the position the player reported), not lesson duration — this is the
   * correct signal for "minutes watched". Rows with updatedAt outside the window
   * are excluded.
   *
   * lessonsCompleted: COUNT of rows where completedAt IS NOT NULL and
   * completedAt falls in the window.
   *
   * Both values are 0 for new users with no progress rows.
   *
   * Added for the your-week home-row query handler (E14-F01-S01).
   */
  aggregateForUserRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<{ minutesWatched: number; lessonsCompleted: number }>;

  /**
   * Return all LessonProgress rows for a (userId, lessonIds[]) combination.
   * Used by the course-outline query handler to derive per-lesson state without
   * an N+1 query. Returns only rows that actually exist.
   *
   * Added for the course-outline query handler (E14-F01-S03).
   */
  findManyByUserAndLessons(userId: string, lessonIds: string[]): Promise<LessonProgress[]>;

  /**
   * Bulk-upsert completed progress rows for every lesson in the list.
   *
   * For each lesson:
   *   - If a row already exists and completed = true: preserve completedAt
   *     (progress history is honest), set positionSeconds = lesson.durationSeconds ?? 0, percent = 100.
   *   - If no row exists or completed = false: insert/update with
   *     completed = true, completedAt = now, positionSeconds = lesson.durationSeconds ?? 0, percent = 100.
   *
   * Idempotent: calling twice produces the same rows.
   * Added for MarkCourseCompleteCommand (E14-F01-S03).
   */
  bulkUpsertCompleted(
    userId: string,
    lessons: readonly { id: string; durationSeconds: number | undefined }[],
    now: Date,
  ): Promise<void>;

  /**
   * Delete every LessonProgress row for (userId, courseId).
   * Idempotent: safe to call when no rows exist.
   * Added for ResetCourseProgressCommand (E14-F01-S03).
   */
  deleteAllByUserAndCourse(userId: string, courseId: string): Promise<void>;
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const LESSON_PROGRESS_REPOSITORY = Symbol('LESSON_PROGRESS_REPOSITORY');

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
}

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const LESSON_PROGRESS_REPOSITORY = Symbol('LESSON_PROGRESS_REPOSITORY');

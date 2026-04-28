/**
 * WHY this file exists:
 * Port (interface + injection token) for the CourseProgressReadModel persistence
 * adapter. The application layer (event handlers, query handlers, rebuild script)
 * depends only on this contract; the Prisma adapter in infra/ implements it.
 *
 * Naming convention:
 *   Token:   COURSE_PROGRESS_READ_MODEL_REPOSITORY
 *   Port:    CourseProgressReadModelRepository (interface)
 *   Adapter: PrismaCourseProgressReadModelRepository
 *   Binding: { provide: COURSE_PROGRESS_READ_MODEL_REPOSITORY, useClass: ... }
 */
import type { CourseProgressReadModel } from './course-progress-read-model';

/** Nest DI injection token — Symbol prevents collisions with class-name strings. */
export const COURSE_PROGRESS_READ_MODEL_REPOSITORY = Symbol(
  'COURSE_PROGRESS_READ_MODEL_REPOSITORY',
);

export interface CourseProgressReadModelRepository {
  /**
   * Insert or update the projection row for (userId, courseId).
   * Idempotent: calling upsert twice with the same data produces the same row.
   */
  upsert(model: CourseProgressReadModel): Promise<void>;

  /** Return the row for a specific (userId, courseId) pair, or null. */
  findByUserAndCourse(userId: string, courseId: string): Promise<CourseProgressReadModel | null>;

  /**
   * Return all rows for a user ordered by lastSeenAt DESC.
   * Used by the continue-watching query handler.
   */
  findManyByUser(userId: string): Promise<CourseProgressReadModel[]>;

  /**
   * Bulk lookup by (userId, courseIds[]) — single query, no N+1.
   * Used by the list-courses mapper to fill progress fields.
   */
  findManyByCourseIdsForUser(
    userId: string,
    courseIds: string[],
  ): Promise<CourseProgressReadModel[]>;

  /**
   * Delete every row in the table. Used by the rebuild-projections script to
   * start from a clean slate before replaying LessonProgress rows.
   * Idempotent: safe to call on an empty table.
   */
  deleteAll(): Promise<void>;

  /**
   * Return up to `limit` rows for a user where the course is fully completed
   * (lessonsCompleted == lessonsTotal AND lessonsTotal > 0), ordered by
   * lastSeenAt DESC (which equals completion time for finished courses).
   * Used by the recently-completed home-row query handler (E14-F01-S01).
   */
  findCompletedByUser(userId: string, limit: number): Promise<CourseProgressReadModel[]>;
}

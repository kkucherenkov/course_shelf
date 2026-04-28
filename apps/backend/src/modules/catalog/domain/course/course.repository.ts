/**
 * WHY this file exists:
 * Domain code must not depend on infrastructure. This port (interface + Symbol
 * token) is the only contract that the application layer sees. The Prisma adapter
 * in infra/ implements it and is bound via the token in CatalogModule.
 *
 * Naming convention:
 *   Token:   COURSE_REPOSITORY
 *   Port:    CourseRepository (interface)
 *   Adapter: PrismaCourseRepository (infra/prisma-course.repository.ts)
 *   Binding: { provide: COURSE_REPOSITORY, useClass: PrismaCourseRepository }
 *
 * Sections are eagerly loaded with courses (composition — no separate repo).
 */
import type { Course } from './course';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const COURSE_REPOSITORY = Symbol('COURSE_REPOSITORY');

export interface CourseRepository {
  /**
   * Persist the aggregate atomically (course row + section rows).
   *
   * Throws CourseSlugAlreadyTakenError when the (libraryId, slug) unique
   * constraint is violated (Prisma P2002 → translated in the adapter).
   */
  save(course: Course): Promise<void>;

  /**
   * Return the aggregate by id with sections eagerly loaded and ordered by
   * position. Returns null when not found.
   */
  findById(id: string): Promise<Course | null>;

  /**
   * Return all courses for a given library, with sections eagerly loaded.
   * Ordered by title asc.
   */
  findManyByLibrary(libraryId: string): Promise<Course[]>;

  /**
   * Return all courses across all libraries, with sections eagerly loaded.
   * Ordered by title asc. Used by admin list endpoint.
   */
  findAll(): Promise<Course[]>;

  /**
   * Bulk fetch courses by a set of ids. Returns only the courses that exist.
   * Order is unspecified — callers must index by id if order matters.
   * Added for the continue-watching query handler (E10-F01-S01).
   */
  findByIds(ids: string[]): Promise<Course[]>;

  /**
   * Return the top-N courses across all libraries, ordered by createdAt DESC.
   * Used by the recently-added home-row query handler (E14-F01-S01).
   *
   * The adapter fetches `limit * 3` rows from the DB so that the authz filter
   * in the handler has enough candidates to fill `limit` visible items even
   * after dropping inaccessible courses. The `* 3` multiplier is a simple
   * heuristic — documented here so the next reader understands the intent.
   *
   * Sections are eagerly loaded (same select as findByIds) so the handler can
   * derive lessonCount and totalDurationSeconds via the lesson join.
   */
  findRecentlyAdded(limit: number): Promise<Course[]>;
}

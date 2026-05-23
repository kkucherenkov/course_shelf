/**
 * WHY this file exists:
 * Domain code must not depend on infrastructure. This port (interface + Symbol
 * token) is the only contract that the application layer sees. The Prisma adapter
 * in infra/ implements it and is bound via the token in CatalogModule.
 *
 * Naming convention:
 *   Token:   INSTRUCTOR_REPOSITORY
 *   Port:    InstructorRepository (interface)
 *   Adapter: PrismaInstructorRepository (infra/prisma-instructor.repository.ts)
 *   Binding: { provide: INSTRUCTOR_REPOSITORY, useClass: PrismaInstructorRepository }
 *
 * findCoursesForInstructor returns courseIds only (not hydrated Course aggregates)
 * so the adapter does not materialise full Course objects. The application layer
 * composes with CourseRepository.findByIds to hydrate the Course aggregates it needs.
 */
import type { Instructor } from './instructor';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const INSTRUCTOR_REPOSITORY = Symbol('INSTRUCTOR_REPOSITORY');

export interface InstructorRepository {
  /**
   * Persist the aggregate (instructor row + external-id rows atomically).
   *
   * Throws InstructorSlugAlreadyTakenError when the slug unique constraint is
   * violated (Prisma P2002 → translated in the adapter).
   */
  save(instructor: Instructor): Promise<void>;

  /**
   * Return the aggregate by id. Returns null when not found.
   * External ids are eagerly loaded.
   */
  findById(id: string): Promise<Instructor | null>;

  /**
   * Return the aggregate by slug. Returns null when not found.
   * Used by the upsert handler to find an existing instructor before creating.
   */
  findBySlug(slug: string): Promise<Instructor | null>;

  /**
   * Reverse-lookup via an external id reference. Returns null when no instructor
   * owns the given (source, externalId) pair. Useful for dedup during scraping:
   * an existing instructor can be found by their platform-specific identifier
   * before a new one is created.
   */
  findByExternalId(source: string, externalId: string): Promise<Instructor | null>;

  /**
   * Bulk fetch instructors by a set of ids. Returns only the instructors that
   * exist — callers must account for the possibility of a shorter result set.
   * Order is unspecified; callers that need a specific order must index by id.
   */
  findManyByIds(ids: string[]): Promise<Instructor[]>;

  /**
   * Return a page of instructors ordered by displayName asc. When search is
   * provided, narrows results to instructors whose displayName contains the
   * search string (case-insensitive substring match — adapter detail).
   */
  findManyPaginated(opts: {
    offset: number;
    limit: number;
    search?: string;
  }): Promise<Instructor[]>;

  /**
   * Count of all instructors (or matching search substring). Paired with
   * findManyPaginated to compute pagination metadata.
   */
  count(search?: string): Promise<number>;

  /**
   * Return the ids of courses linked to this instructor, with pagination.
   * Returns courseIds only — not hydrated Course aggregates — so the adapter
   * does not need to join the full course select. The application layer composes
   * with CourseRepository.findByIds.
   *
   * Throws InstructorNotFoundError when the instructor id does not exist.
   */
  findCoursesForInstructor(
    id: string,
    opts: { offset: number; limit: number },
  ): Promise<{ courseIds: string[]; total: number }>;
}

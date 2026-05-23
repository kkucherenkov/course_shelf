/**
 * WHY this file exists:
 * Domain code must not depend on infrastructure. This port (interface + Symbol
 * token) is the only contract that the application layer sees. The Prisma adapter
 * in infra/ implements it and is bound via the token in CatalogModule.
 *
 * Naming convention:
 *   Token:   STUDIO_REPOSITORY
 *   Port:    StudioRepository (interface)
 *   Adapter: PrismaStudioRepository (infra/prisma-studio.repository.ts)
 *   Binding: { provide: STUDIO_REPOSITORY, useClass: PrismaStudioRepository }
 *
 * findCoursesForStudio returns courseIds only (not hydrated Course aggregates)
 * so the adapter does not materialise full Course objects. The application layer
 * composes with CourseRepository.findByIds to hydrate the Course aggregates it needs.
 */
import type { Studio } from './studio';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const STUDIO_REPOSITORY = Symbol('STUDIO_REPOSITORY');

export interface StudioRepository {
  /**
   * Persist the aggregate (studio row + external-id rows atomically).
   *
   * Throws StudioSlugAlreadyTakenError when the slug unique constraint is
   * violated (Prisma P2002 → translated in the adapter).
   */
  save(studio: Studio): Promise<void>;

  /**
   * Return the aggregate by id. Returns null when not found.
   * External ids are eagerly loaded.
   */
  findById(id: string): Promise<Studio | null>;

  /**
   * Return the aggregate by slug. Returns null when not found.
   * Used by the upsert handler to find an existing studio before creating.
   */
  findBySlug(slug: string): Promise<Studio | null>;

  /**
   * Reverse-lookup via an external id reference. Returns null when no studio
   * owns the given (source, externalId) pair. Useful for dedup during scraping:
   * an existing studio can be found by their platform-specific identifier
   * before a new one is created.
   */
  findByExternalId(source: string, externalId: string): Promise<Studio | null>;

  /**
   * Bulk fetch studios by a set of ids. Returns only the studios that
   * exist — callers must account for the possibility of a shorter result set.
   * Order is unspecified; callers that need a specific order must index by id.
   */
  findManyByIds(ids: string[]): Promise<Studio[]>;

  /**
   * Return a page of studios ordered by displayName asc. When search is
   * provided, narrows results to studios whose displayName contains the
   * search string (case-insensitive substring match — adapter detail).
   */
  findManyPaginated(opts: { offset: number; limit: number; search?: string }): Promise<Studio[]>;

  /**
   * Count of all studios (or matching search substring). Paired with
   * findManyPaginated to compute pagination metadata.
   */
  count(search?: string): Promise<number>;

  /**
   * Return the ids of courses linked to this studio, with pagination.
   * Returns courseIds only — not hydrated Course aggregates — so the adapter
   * does not need to join the full course select. The application layer composes
   * with CourseRepository.findByIds.
   *
   * Throws StudioNotFoundError when the studio id does not exist.
   */
  findCoursesForStudio(
    id: string,
    opts: { offset: number; limit: number },
  ): Promise<{ courseIds: string[]; total: number }>;
}

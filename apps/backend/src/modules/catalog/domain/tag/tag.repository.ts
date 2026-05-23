/**
 * WHY this file exists:
 * Domain code must not depend on infrastructure. This port (interface + Symbol
 * token) is the only contract that the application layer sees. The Prisma adapter
 * in infra/ implements it and is bound via the token in CatalogModule.
 *
 * Naming convention:
 *   Token:   TAG_REPOSITORY
 *   Port:    TagRepository (interface)
 *   Adapter: PrismaTagRepository (infra/prisma-tag.repository.ts)
 *   Binding: { provide: TAG_REPOSITORY, useClass: PrismaTagRepository }
 *
 * findManyPaginated accepts an optional category filter to narrow results to
 * tags belonging to a given category. The adapter handles the case-insensitive
 * equality match as an implementation detail.
 *
 * findCoursesForTag returns courseIds only (not hydrated Course aggregates)
 * so the adapter does not materialise full Course objects. The application layer
 * composes with CourseRepository.findByIds to hydrate the Course aggregates it needs.
 */
import type { Tag } from './tag';

/** Injection token — Symbol ensures global uniqueness across the process. */
export const TAG_REPOSITORY = Symbol('TAG_REPOSITORY');

export interface TagRepository {
  /**
   * Persist the aggregate (tag row + external-id rows atomically).
   *
   * Throws TagSlugAlreadyTakenError when the slug unique constraint is
   * violated (Prisma P2002 → translated in the adapter).
   */
  save(tag: Tag): Promise<void>;

  /**
   * Return the aggregate by id. Returns null when not found.
   * External ids are eagerly loaded.
   */
  findById(id: string): Promise<Tag | null>;

  /**
   * Return the aggregate by slug. Returns null when not found.
   * Used by the upsert handler to find an existing tag before creating.
   */
  findBySlug(slug: string): Promise<Tag | null>;

  /**
   * Reverse-lookup via an external id reference. Returns null when no tag
   * owns the given (source, externalId) pair. Useful for dedup during scraping.
   */
  findByExternalId(source: string, externalId: string): Promise<Tag | null>;

  /**
   * Bulk fetch tags by a set of ids. Returns only the tags that exist —
   * callers must account for the possibility of a shorter result set.
   * Order is unspecified; callers that need a specific order must index by id.
   */
  findManyByIds(ids: string[]): Promise<Tag[]>;

  /**
   * Return a page of tags ordered by displayName asc. When search is provided,
   * narrows results to tags whose displayName contains the search string
   * (case-insensitive substring match — adapter detail). When category is
   * provided, narrows results to tags with a matching category
   * (case-insensitive equality — adapter detail).
   */
  findManyPaginated(opts: {
    offset: number;
    limit: number;
    search?: string;
    category?: string;
  }): Promise<Tag[]>;

  /**
   * Count of all tags (or matching search/category filters). Paired with
   * findManyPaginated to compute pagination metadata.
   */
  count(opts?: { search?: string; category?: string }): Promise<number>;

  /**
   * Return the ids of courses linked to this tag, with pagination.
   * Returns courseIds only — not hydrated Course aggregates — so the adapter
   * does not need to join the full course select. The application layer composes
   * with CourseRepository.findByIds.
   *
   * Throws TagNotFoundError when the tag id does not exist.
   */
  findCoursesForTag(
    id: string,
    opts: { offset: number; limit: number },
  ): Promise<{ courseIds: string[]; total: number }>;
}

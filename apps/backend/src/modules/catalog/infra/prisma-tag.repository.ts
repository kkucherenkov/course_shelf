/**
 * WHY this file exists:
 * Prisma adapter that implements the TagRepository port. It is the only
 * place in the Catalog bounded context that knows about the `tag` table.
 * All other layers (domain, application, controller) depend only on the port
 * interface defined in domain/tag/tag.repository.ts.
 *
 * Mirrors PrismaInstructorRepository with two additions:
 *   1. tag.category column is read/written.
 *   2. findManyPaginated accepts an optional category filter (case-insensitive
 *      equality) in addition to the search substring filter.
 *
 * P2002 translation: Prisma raises PrismaClientKnownRequestError with code P2002
 * on the slug unique constraint. We catch it here and rethrow as
 * TagSlugAlreadyTakenError so the application layer stays free of Prisma types.
 *
 * findCoursesForTag returns courseIds only (not hydrated Course aggregates)
 * so the adapter does not materialise full Course objects. The application layer
 * composes with CourseRepository.findByIds to hydrate the Course aggregates it needs.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Tag } from '../domain/tag/tag';
import { TagSlugAlreadyTakenError } from '../domain/tag/tag.errors';
import { EXTERNAL_ID_REPOSITORY } from '../domain/shared-vo/external-id.repository';

import type { TagRepository } from '../domain/tag/tag.repository';
import type { TagId } from '../domain/tag/tag';
import type { ExternalIdRepository } from '../domain/shared-vo/external-id.repository';
import type { ExternalIdRef } from '../domain/shared-vo/external-id-ref';

/** Shape of a tag row returned by Prisma. */
interface TagRow {
  id: string;
  slug: string;
  displayName: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TAG_SELECT = {
  id: true,
  slug: true,
  displayName: true,
  category: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaTagRepository implements TagRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXTERNAL_ID_REPOSITORY) private readonly externalIds: ExternalIdRepository,
  ) {}

  /**
   * Persist the aggregate (tag row + external-id rows) atomically.
   * Throws TagSlugAlreadyTakenError on P2002 slug collision.
   */
  async save(tag: Tag): Promise<void> {
    try {
      // WHY $transaction: tag row + external-id rows must land atomically so
      // a partial write (tag present, external ids missing) never enters the DB.
      await this.prisma.$transaction(async (tx) => {
        await tx.tag.upsert({
          where: { id: tag.id },
          create: {
            id: tag.id,
            slug: tag.slug,
            displayName: tag.displayName,
            category: tag.category ?? null,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
          },
          update: {
            slug: tag.slug,
            displayName: tag.displayName,
            category: tag.category ?? null,
            updatedAt: tag.updatedAt,
          },
        });

        await this.externalIds.replaceForEntity('tag', tag.id, tag.externalIds, tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new TagSlugAlreadyTakenError(tag.slug);
      }
      throw error;
    }
  }

  /** Return the aggregate by id. Returns null when not found. */
  async findById(id: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({
      where: { id },
      select: TAG_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('tag', id);
    return this.rowToAggregate(row, refs);
  }

  /** Return the aggregate by slug. Returns null when not found. */
  async findBySlug(slug: string): Promise<Tag | null> {
    const row = await this.prisma.tag.findUnique({
      where: { slug },
      select: TAG_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('tag', row.id);
    return this.rowToAggregate(row, refs);
  }

  /**
   * Reverse-lookup via external id. Returns null when no match or when
   * entityType !== 'tag'.
   */
  async findByExternalId(source: string, externalId: string): Promise<Tag | null> {
    const entity = await this.externalIds.findEntity(source, externalId);
    if (entity?.entityType !== 'tag') return null;
    return this.findById(entity.entityId);
  }

  /**
   * Bulk fetch tags by a set of ids. Batches the external-id load in a
   * single query grouped in memory. Order is unspecified per the port contract.
   */
  async findManyByIds(ids: string[]): Promise<Tag[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.tag.findMany({
      where: { id: { in: ids } },
      select: TAG_SELECT,
    });

    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'tag', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = groupRefsByEntityId(allRefs);

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /**
   * Return a page of tags ordered by category asc then displayName asc.
   * When search is provided, narrows results to displayName case-insensitive
   * substring match. When category is provided, narrows to exact category
   * match (case-insensitive).
   */
  async findManyPaginated(opts: {
    offset: number;
    limit: number;
    search?: string;
    category?: string;
  }): Promise<Tag[]> {
    const andClauses: Prisma.TagWhereInput[] = [];
    if (opts.search) {
      andClauses.push({ displayName: { contains: opts.search, mode: 'insensitive' } });
    }
    if (opts.category !== undefined) {
      andClauses.push({ category: { equals: opts.category, mode: 'insensitive' } });
    }
    const where: Prisma.TagWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    const rows = await this.prisma.tag.findMany({
      where,
      select: TAG_SELECT,
      orderBy: [{ category: 'asc' }, { displayName: 'asc' }],
      skip: opts.offset,
      take: opts.limit,
    });

    if (rows.length === 0) return [];

    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'tag', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = groupRefsByEntityId(allRefs);

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /**
   * Count of all tags (or matching search/category filters). Paired with
   * findManyPaginated to compute pagination metadata.
   */
  async count(opts?: { search?: string; category?: string }): Promise<number> {
    const andClauses: Prisma.TagWhereInput[] = [];
    if (opts?.search) {
      andClauses.push({ displayName: { contains: opts.search, mode: 'insensitive' } });
    }
    if (opts?.category !== undefined) {
      andClauses.push({ category: { equals: opts.category, mode: 'insensitive' } });
    }
    const where: Prisma.TagWhereInput = andClauses.length > 0 ? { AND: andClauses } : {};

    return this.prisma.tag.count({ where });
  }

  /**
   * Return courseIds + total for courses linked to this tag, with pagination.
   * courseTag has no position column, so ordered by course.title asc only.
   */
  async findCoursesForTag(
    id: string,
    opts: { offset: number; limit: number },
  ): Promise<{ courseIds: string[]; total: number }> {
    const [total, rows] = await Promise.all([
      this.prisma.courseTag.count({ where: { tagId: id } }),
      this.prisma.courseTag.findMany({
        where: { tagId: id },
        select: {
          courseId: true,
          course: { select: { title: true } },
        },
        orderBy: { course: { title: 'asc' } },
        skip: opts.offset,
        take: opts.limit,
      }),
    ]);

    return { courseIds: rows.map((r) => r.courseId), total };
  }

  // ---------------------------------------------------------------------------
  // Private mapper — row shape → domain aggregate
  // ---------------------------------------------------------------------------

  /** Map a DB row + preloaded external id refs to a Tag aggregate. */
  private rowToAggregate(row: TagRow, externalIds: ExternalIdRef[]): Tag {
    return Tag.reconstitute({
      id: row.id as TagId,
      slug: row.slug,
      displayName: row.displayName,
      category: row.category,
      externalIds,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

/** Group external id rows by entityId for O(1) lookup in the mapper. */
function groupRefsByEntityId(
  rows: { entityId: string; source: string; externalId: string; url: string | null }[],
): Map<string, ExternalIdRef[]> {
  const map = new Map<string, ExternalIdRef[]>();
  for (const r of rows) {
    const list = map.get(r.entityId) ?? [];
    list.push({
      source: r.source,
      externalId: r.externalId,
      ...(r.url === null ? {} : { url: r.url }),
    });
    map.set(r.entityId, list);
  }
  return map;
}

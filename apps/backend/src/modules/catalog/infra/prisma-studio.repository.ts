/**
 * WHY this file exists:
 * Prisma adapter that implements the StudioRepository port. It is the only
 * place in the Catalog bounded context that knows about the `studio` table.
 * All other layers (domain, application, controller) depend only on the port
 * interface defined in domain/studio/studio.repository.ts.
 *
 * Mirrors PrismaInstructorRepository exactly — studios are a parallel concept
 * (production entity vs. teaching entity) with identical structural rules.
 *
 * P2002 translation: Prisma raises PrismaClientKnownRequestError with code P2002
 * on the slug unique constraint. We catch it here and rethrow as
 * StudioSlugAlreadyTakenError so the application layer stays free of Prisma types.
 *
 * findCoursesForStudio returns courseIds only (not hydrated Course aggregates)
 * so the adapter does not materialise full Course objects. The application layer
 * composes with CourseRepository.findByIds to hydrate the Course aggregates it needs.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Studio } from '../domain/studio/studio';
import { StudioSlugAlreadyTakenError } from '../domain/studio/studio.errors';
import { EXTERNAL_ID_REPOSITORY } from '../domain/shared-vo/external-id.repository';

import type { StudioRepository } from '../domain/studio/studio.repository';
import type { StudioId } from '../domain/studio/studio';
import type { ExternalIdRepository } from '../domain/shared-vo/external-id.repository';
import type { ExternalIdRef } from '../domain/shared-vo/external-id-ref';

/** Shape of a studio row returned by Prisma. */
interface StudioRow {
  id: string;
  slug: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const STUDIO_SELECT = {
  id: true,
  slug: true,
  displayName: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaStudioRepository implements StudioRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXTERNAL_ID_REPOSITORY) private readonly externalIds: ExternalIdRepository,
  ) {}

  /**
   * Persist the aggregate (studio row + external-id rows) atomically.
   * Throws StudioSlugAlreadyTakenError on P2002 slug collision.
   */
  async save(studio: Studio): Promise<void> {
    try {
      // WHY $transaction: studio row + external-id rows must land atomically so
      // a partial write (studio present, external ids missing) never enters the DB.
      await this.prisma.$transaction(async (tx) => {
        await tx.studio.upsert({
          where: { id: studio.id },
          create: {
            id: studio.id,
            slug: studio.slug,
            displayName: studio.displayName,
            createdAt: studio.createdAt,
            updatedAt: studio.updatedAt,
          },
          update: {
            slug: studio.slug,
            displayName: studio.displayName,
            updatedAt: studio.updatedAt,
          },
        });

        await this.externalIds.replaceForEntity('studio', studio.id, studio.externalIds, tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new StudioSlugAlreadyTakenError(studio.slug);
      }
      throw error;
    }
  }

  /** Return the aggregate by id. Returns null when not found. */
  async findById(id: string): Promise<Studio | null> {
    const row = await this.prisma.studio.findUnique({
      where: { id },
      select: STUDIO_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('studio', id);
    return this.rowToAggregate(row, refs);
  }

  /** Return the aggregate by slug. Returns null when not found. */
  async findBySlug(slug: string): Promise<Studio | null> {
    const row = await this.prisma.studio.findUnique({
      where: { slug },
      select: STUDIO_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('studio', row.id);
    return this.rowToAggregate(row, refs);
  }

  /**
   * Reverse-lookup via external id. Returns null when no match or when
   * entityType !== 'studio'.
   */
  async findByExternalId(source: string, externalId: string): Promise<Studio | null> {
    const entity = await this.externalIds.findEntity(source, externalId);
    if (entity?.entityType !== 'studio') return null;
    return this.findById(entity.entityId);
  }

  /**
   * Bulk fetch studios by a set of ids. Batches the external-id load in a
   * single query grouped in memory. Order is unspecified per the port contract.
   */
  async findManyByIds(ids: string[]): Promise<Studio[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.studio.findMany({
      where: { id: { in: ids } },
      select: STUDIO_SELECT,
    });

    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'studio', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = groupRefsByEntityId(allRefs);

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /**
   * Return a page of studios ordered by displayName asc.
   * When search is provided, narrows results to displayName case-insensitive
   * substring match.
   */
  async findManyPaginated(opts: {
    offset: number;
    limit: number;
    search?: string;
  }): Promise<Studio[]> {
    const where = opts.search
      ? { displayName: { contains: opts.search, mode: 'insensitive' as const } }
      : {};

    const rows = await this.prisma.studio.findMany({
      where,
      select: STUDIO_SELECT,
      orderBy: { displayName: 'asc' },
      skip: opts.offset,
      take: opts.limit,
    });

    if (rows.length === 0) return [];

    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'studio', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = groupRefsByEntityId(allRefs);

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /** Count of all studios (or matching search substring). */
  async count(search?: string): Promise<number> {
    const where = search ? { displayName: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.studio.count({ where });
  }

  /**
   * Return courseIds + total for courses linked to this studio, with pagination.
   * courseStudio has no position column, so ordered by course.title asc only.
   */
  async findCoursesForStudio(
    id: string,
    opts: { offset: number; limit: number },
  ): Promise<{ courseIds: string[]; total: number }> {
    const [total, rows] = await Promise.all([
      this.prisma.courseStudio.count({ where: { studioId: id } }),
      this.prisma.courseStudio.findMany({
        where: { studioId: id },
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

  /** Map a DB row + preloaded external id refs to a Studio aggregate. */
  private rowToAggregate(row: StudioRow, externalIds: ExternalIdRef[]): Studio {
    return Studio.reconstitute({
      id: row.id as StudioId,
      slug: row.slug,
      displayName: row.displayName,
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

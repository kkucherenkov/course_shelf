/**
 * WHY this file exists:
 * Prisma adapter that implements the InstructorRepository port. It is the only
 * place in the Catalog bounded context that knows about the `instructor` table.
 * All other layers (domain, application, controller) depend only on the port
 * interface defined in domain/instructor/instructor.repository.ts.
 *
 * Save strategy: $transaction that upserts the instructor row, then delegates
 * external-id replacement to ExternalIdRepository.replaceForEntity (passing
 * the transaction client so both writes land atomically).
 *
 * P2002 translation: Prisma raises PrismaClientKnownRequestError with code P2002
 * on the slug unique constraint. We catch it here and rethrow as
 * InstructorSlugAlreadyTakenError so the application layer stays free of Prisma types.
 *
 * findCoursesForInstructor returns courseIds only (not hydrated Course aggregates)
 * so the adapter does not materialise full Course objects. The application layer
 * composes with CourseRepository.findByIds to hydrate the Course aggregates it needs.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Instructor } from '../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../domain/instructor/instructor.errors';
import { EXTERNAL_ID_REPOSITORY } from '../domain/shared-vo/external-id.repository';

import type { InstructorRepository } from '../domain/instructor/instructor.repository';
import type { InstructorId } from '../domain/instructor/instructor';
import type { ExternalIdRepository } from '../domain/shared-vo/external-id.repository';
import type { ExternalIdRef } from '../domain/shared-vo/external-id-ref';

/** Shape of an instructor row returned by Prisma. */
interface InstructorRow {
  id: string;
  slug: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

const INSTRUCTOR_SELECT = {
  id: true,
  slug: true,
  displayName: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaInstructorRepository implements InstructorRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXTERNAL_ID_REPOSITORY) private readonly externalIds: ExternalIdRepository,
  ) {}

  /**
   * Persist the aggregate (instructor row + external-id rows) atomically.
   * Throws InstructorSlugAlreadyTakenError on P2002 slug collision.
   */
  async save(instructor: Instructor): Promise<void> {
    try {
      // WHY $transaction: instructor row + external-id rows must land atomically
      // so a partial write (instructor present, external ids missing) never enters
      // the DB. External ids are replaced via the shared adapter inside the same tx.
      await this.prisma.$transaction(async (tx) => {
        await tx.instructor.upsert({
          where: { id: instructor.id },
          create: {
            id: instructor.id,
            slug: instructor.slug,
            displayName: instructor.displayName,
            createdAt: instructor.createdAt,
            updatedAt: instructor.updatedAt,
          },
          update: {
            slug: instructor.slug,
            displayName: instructor.displayName,
            updatedAt: instructor.updatedAt,
          },
        });

        await this.externalIds.replaceForEntity(
          'instructor',
          instructor.id,
          instructor.externalIds,
          tx,
        );
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new InstructorSlugAlreadyTakenError(instructor.slug);
      }
      throw error;
    }
  }

  /** Return the aggregate by id. Returns null when not found. */
  async findById(id: string): Promise<Instructor | null> {
    const row = await this.prisma.instructor.findUnique({
      where: { id },
      select: INSTRUCTOR_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('instructor', id);
    return this.rowToAggregate(row, refs);
  }

  /** Return the aggregate by slug. Returns null when not found. */
  async findBySlug(slug: string): Promise<Instructor | null> {
    const row = await this.prisma.instructor.findUnique({
      where: { slug },
      select: INSTRUCTOR_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('instructor', row.id);
    return this.rowToAggregate(row, refs);
  }

  /**
   * Reverse-lookup via external id. Delegates to ExternalIdRepository.findEntity,
   * then loads the instructor aggregate when the entity type matches.
   * Returns null when no match or when entityType !== 'instructor'.
   */
  async findByExternalId(source: string, externalId: string): Promise<Instructor | null> {
    const entity = await this.externalIds.findEntity(source, externalId);
    if (entity?.entityType !== 'instructor') return null;
    return this.findById(entity.entityId);
  }

  /**
   * Bulk fetch instructors by a set of ids. Returns only the instructors that
   * exist. Batches the external-id load in a single query grouped in memory.
   * Order of the returned array is unspecified per the port contract.
   */
  async findManyByIds(ids: string[]): Promise<Instructor[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.instructor.findMany({
      where: { id: { in: ids } },
      select: INSTRUCTOR_SELECT,
    });

    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'instructor', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = groupRefsByEntityId(allRefs);

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /**
   * Return a page of instructors ordered by displayName asc.
   * When search is provided, narrows results to displayName case-insensitive
   * substring match.
   */
  async findManyPaginated(opts: {
    offset: number;
    limit: number;
    search?: string;
  }): Promise<Instructor[]> {
    const where = opts.search
      ? { displayName: { contains: opts.search, mode: 'insensitive' as const } }
      : {};

    const rows = await this.prisma.instructor.findMany({
      where,
      select: INSTRUCTOR_SELECT,
      orderBy: { displayName: 'asc' },
      skip: opts.offset,
      take: opts.limit,
    });

    if (rows.length === 0) return [];

    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'instructor', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = groupRefsByEntityId(allRefs);

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /** Count of all instructors (or matching search substring). */
  async count(search?: string): Promise<number> {
    const where = search ? { displayName: { contains: search, mode: 'insensitive' as const } } : {};

    return this.prisma.instructor.count({ where });
  }

  /**
   * Return courseIds + total for courses linked to this instructor, with
   * pagination. Ordered by position asc, then course.title asc.
   */
  async findCoursesForInstructor(
    id: string,
    opts: { offset: number; limit: number },
  ): Promise<{ courseIds: string[]; total: number }> {
    const [total, rows] = await Promise.all([
      this.prisma.courseInstructor.count({ where: { instructorId: id } }),
      this.prisma.courseInstructor.findMany({
        where: { instructorId: id },
        select: {
          courseId: true,
          position: true,
          course: { select: { title: true } },
        },
        orderBy: [{ position: 'asc' }, { course: { title: 'asc' } }],
        skip: opts.offset,
        take: opts.limit,
      }),
    ]);

    return { courseIds: rows.map((r) => r.courseId), total };
  }

  // ---------------------------------------------------------------------------
  // Private mapper — row shape → domain aggregate
  // ---------------------------------------------------------------------------

  /** Map a DB row + preloaded external id refs to an Instructor aggregate. */
  private rowToAggregate(row: InstructorRow, externalIds: ExternalIdRef[]): Instructor {
    return Instructor.reconstitute({
      id: row.id as InstructorId,
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

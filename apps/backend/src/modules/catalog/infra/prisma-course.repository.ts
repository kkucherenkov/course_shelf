/**
 * WHY this file exists:
 * Prisma adapter that implements the CourseRepository port. It is the only place
 * in the Catalog bounded context that knows about the `course`, `section`,
 * `courseInstructor`, `courseStudio`, `courseTag`, and `externalId` tables.
 * All other layers (domain, application, controller) depend only on the port.
 *
 * Save strategy: delete-and-recreate sections, instructor/studio/tag join rows,
 * and external ids inside a transaction so the course row and its children always
 * land atomically. v1 never has concurrent section edits (the aggregate serialises
 * them), so delete-and-recreate is safe and simpler than a diff-based upsert.
 * See the comment on $transaction below.
 *
 * P2002 translation: Prisma raises PrismaClientKnownRequestError with code P2002
 * on the (libraryId, slug) unique constraint. We catch it here and rethrow as
 * CourseSlugAlreadyTakenError so the application layer stays free of Prisma types.
 *
 * External ids are loaded in a batched query (one findMany per multi-result
 * method) and grouped in memory — never N+1 per course.
 *
 * ratingAverage is stored as Prisma.Decimal (DB Decimal(3,2)) and converted
 * to/from JS number at the adapter boundary. The DB always holds normalised
 * language tags (writes go through the aggregate's LanguageTag VO), so
 * Course.reconstitute receiving a DB string is safe.
 */
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Course } from '../domain/course/course';
import { CourseSlugAlreadyTakenError } from '../domain/course/course.errors';
import { EXTERNAL_ID_REPOSITORY } from '../domain/shared-vo/external-id.repository';

import type { CourseRepository } from '../domain/course/course.repository';
import type { CourseId } from '../domain/course/course';
import type { ExternalIdRepository } from '../domain/shared-vo/external-id.repository';
import type { ExternalIdRef } from '../domain/shared-vo/external-id-ref';

/** Shape of a course row returned by Prisma with sections and join arrays. */
interface CourseRow {
  id: string;
  libraryId: string;
  slug: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  posterStoragePath: string | null;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all_levels' | null;
  language: string | null;
  releaseDate: Date | null;
  sourceUpdatedAt: Date | null;
  ratingAverage: Prisma.Decimal | null;
  ratingCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  sections: { id: string; courseId: string; position: number; title: string }[];
  instructors: {
    instructorId: string;
    position: number;
    instructor: { id: string; slug: string; displayName: string };
  }[];
  studios: {
    studioId: string;
    studio: { id: string; slug: string; displayName: string };
  }[];
  tags: {
    tagId: string;
    tag: { id: string; slug: string; displayName: string; category: string | null };
  }[];
}

const COURSE_WITH_SECTIONS_SELECT = {
  id: true,
  libraryId: true,
  slug: true,
  title: true,
  description: true,
  posterUrl: true,
  posterStoragePath: true,
  level: true,
  language: true,
  releaseDate: true,
  sourceUpdatedAt: true,
  ratingAverage: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
  sections: {
    select: { id: true, courseId: true, position: true, title: true },
    orderBy: { position: 'asc' as const },
  },
  instructors: {
    select: {
      instructorId: true,
      position: true,
      instructor: { select: { id: true, slug: true, displayName: true } },
    },
    orderBy: { position: 'asc' as const },
  },
  studios: {
    select: {
      studioId: true,
      studio: { select: { id: true, slug: true, displayName: true } },
    },
    orderBy: { studio: { displayName: 'asc' as const } },
  },
  tags: {
    select: {
      tagId: true,
      tag: { select: { id: true, slug: true, displayName: true, category: true } },
    },
    orderBy: { tag: { displayName: 'asc' as const } },
  },
} as const;

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(EXTERNAL_ID_REPOSITORY) private readonly externalIds: ExternalIdRepository,
  ) {}

  async save(course: Course): Promise<void> {
    try {
      // WHY $transaction: course + sections + join tables + external ids must all
      // land atomically so a partial write never enters the DB. Delete-and-recreate
      // for sections, join rows, and external ids is acceptable in v1 because
      // concurrent edits go through the aggregate serialiser and counts are small.
      await this.prisma.$transaction(async (tx) => {
        await tx.course.upsert({
          where: { id: course.id },
          create: {
            id: course.id,
            libraryId: course.libraryId,
            slug: course.slug,
            title: course.title,
            description: course.description ?? null,
            posterUrl: course.posterUrl ?? null,
            posterStoragePath: course.posterStoragePath ?? null,
            level: course.level ?? null,
            language: course.language ?? null,
            releaseDate: course.releaseDate ?? null,
            sourceUpdatedAt: course.sourceUpdatedAt ?? null,
            ratingAverage:
              course.ratingAverage === undefined ? null : new Prisma.Decimal(course.ratingAverage),
            ratingCount: course.ratingCount ?? null,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
          },
          update: {
            slug: course.slug,
            title: course.title,
            description: course.description ?? null,
            posterUrl: course.posterUrl ?? null,
            posterStoragePath: course.posterStoragePath ?? null,
            level: course.level ?? null,
            language: course.language ?? null,
            releaseDate: course.releaseDate ?? null,
            sourceUpdatedAt: course.sourceUpdatedAt ?? null,
            ratingAverage:
              course.ratingAverage === undefined ? null : new Prisma.Decimal(course.ratingAverage),
            ratingCount: course.ratingCount ?? null,
            updatedAt: course.updatedAt,
          },
        });

        // Sections: delete all existing, then recreate from aggregate state.
        await tx.section.deleteMany({ where: { courseId: course.id } });
        if (course.sections.length > 0) {
          await tx.section.createMany({
            data: course.sections.map((s) => ({
              id: s.id,
              courseId: course.id,
              position: s.position,
              title: s.title,
            })),
          });
        }

        // Instructor join rows: delete-and-recreate with position from array index.
        await tx.courseInstructor.deleteMany({ where: { courseId: course.id } });
        if (course.instructors.length > 0) {
          await tx.courseInstructor.createMany({
            data: course.instructors.map((ref, i) => ({
              courseId: course.id,
              instructorId: ref.id,
              position: i,
            })),
          });
        }

        // Studio join rows: delete-and-recreate (no position column).
        await tx.courseStudio.deleteMany({ where: { courseId: course.id } });
        if (course.studios.length > 0) {
          await tx.courseStudio.createMany({
            data: course.studios.map((ref) => ({
              courseId: course.id,
              studioId: ref.id,
            })),
          });
        }

        // Tag join rows: delete-and-recreate (no position column).
        await tx.courseTag.deleteMany({ where: { courseId: course.id } });
        if (course.tags.length > 0) {
          await tx.courseTag.createMany({
            data: course.tags.map((ref) => ({
              courseId: course.id,
              tagId: ref.id,
            })),
          });
        }

        await this.externalIds.replaceForEntity('course', course.id, course.externalIds, tx);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new CourseSlugAlreadyTakenError(course.slug);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Course | null> {
    const row = await this.prisma.course.findUnique({
      where: { id },
      select: COURSE_WITH_SECTIONS_SELECT,
    });

    if (!row) return null;

    const refs = await this.externalIds.findByEntity('course', id);
    return this.rowToAggregate(row, refs);
  }

  async findManyByLibrary(libraryId: string): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      where: { libraryId },
      select: COURSE_WITH_SECTIONS_SELECT,
      orderBy: { title: 'asc' },
    });

    return this.attachExternalIds(rows);
  }

  async findAll(): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      select: COURSE_WITH_SECTIONS_SELECT,
      orderBy: { title: 'asc' },
    });

    return this.attachExternalIds(rows);
  }

  async findByIds(ids: string[]): Promise<Course[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.course.findMany({
      where: { id: { in: ids } },
      select: COURSE_WITH_SECTIONS_SELECT,
    });

    return this.attachExternalIds(rows);
  }

  /**
   * Return the top-(limit * 3) courses ordered by createdAt DESC.
   * The 3× overhead gives the authz filter in the handler enough candidates
   * to fill `limit` visible items even if some courses are inaccessible.
   * Sections are included so the handler can compute lessonCount via a
   * separate lesson query if needed (sections carry no lesson data themselves,
   * but the aggregate is ready for any future enrichment).
   */
  async findRecentlyAdded(limit: number): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      select: COURSE_WITH_SECTIONS_SELECT,
      orderBy: { createdAt: 'desc' },
      take: limit * 3,
    });

    return this.attachExternalIds(rows);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Batch-load external ids for a set of course rows in a single query,
   * group by courseId in memory, and build Course aggregates.
   * Avoids N+1 round-trips for multi-result query methods.
   */
  private async attachExternalIds(rows: CourseRow[]): Promise<Course[]> {
    if (rows.length === 0) return [];

    const courseIds = rows.map((r) => r.id);
    const allRefs = await this.prisma.externalId.findMany({
      where: { entityType: 'course', entityId: { in: courseIds } },
      orderBy: { createdAt: 'asc' },
    });

    const refsByEntity = new Map<string, ExternalIdRef[]>();
    for (const r of allRefs) {
      const list = refsByEntity.get(r.entityId) ?? [];
      list.push({
        source: r.source,
        externalId: r.externalId,
        ...(r.url === null ? {} : { url: r.url }),
      });
      refsByEntity.set(r.entityId, list);
    }

    return rows.map((r) => this.rowToAggregate(r, refsByEntity.get(r.id) ?? []));
  }

  /**
   * Map a DB row + preloaded external id refs to a Course aggregate.
   * ratingAverage is stored as Prisma.Decimal and converted to JS number here.
   * WHY language is safe without re-validation: the DB always holds normalised
   * BCP-47 values because writes go through Course.setLanguage / the LanguageTag VO.
   */
  private rowToAggregate(row: CourseRow, externalIds: ExternalIdRef[]): Course {
    // WHY spread conditionals: exactOptionalPropertyTypes is on. Optional props
    // in CourseProps (e.g. posterUrl?: string) must be absent (not `undefined`)
    // when the DB column is null. Spreading `{}` vs `{ key: value }` achieves
    // that without casting. `description` is required (string | undefined) so
    // it is passed directly, not via spread.
    return Course.reconstitute({
      id: row.id as CourseId,
      libraryId: row.libraryId,
      slug: row.slug,
      title: row.title,
      description: row.description ?? undefined,
      ...(row.posterUrl === null ? {} : { posterUrl: row.posterUrl }),
      ...(row.posterStoragePath === null ? {} : { posterStoragePath: row.posterStoragePath }),
      ...(row.level === null ? {} : { level: row.level }),
      ...(row.language === null ? {} : { language: row.language }),
      ...(row.releaseDate === null ? {} : { releaseDate: row.releaseDate }),
      ...(row.sourceUpdatedAt === null ? {} : { sourceUpdatedAt: row.sourceUpdatedAt }),
      ...(row.ratingAverage === null
        ? {}
        : { ratingAverage: Number(row.ratingAverage.toString()) }),
      ...(row.ratingCount === null ? {} : { ratingCount: row.ratingCount }),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sections: row.sections.map((s) => ({
        id: s.id,
        position: s.position,
        title: s.title,
      })),
      instructors: row.instructors.map((ci) => ({
        id: ci.instructor.id,
        slug: ci.instructor.slug,
        displayName: ci.instructor.displayName,
      })),
      studios: row.studios.map((cs) => ({
        id: cs.studio.id,
        slug: cs.studio.slug,
        displayName: cs.studio.displayName,
      })),
      tags: row.tags.map((ct) => ({
        id: ct.tag.id,
        slug: ct.tag.slug,
        displayName: ct.tag.displayName,
        category: ct.tag.category,
      })),
      externalIds,
    });
  }
}

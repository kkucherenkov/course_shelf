/**
 * WHY this file exists:
 * Prisma adapter that implements the CourseRepository port. It is the only place
 * in the Catalog bounded context that knows about the `course` and `section`
 * tables. All other layers (domain, application, controller) depend only on the
 * port interface.
 *
 * Save strategy: delete-and-recreate sections inside a transaction so that the
 * course row and its sections always land atomically. v1 never has concurrent
 * section edits (the aggregate serialises them), so delete-and-recreate is safe
 * and simpler than a diff-based upsert. See the comment on $transaction below.
 *
 * P2002 translation: Prisma raises PrismaClientKnownRequestError with code P2002
 * on the (libraryId, slug) unique constraint. We catch it here and rethrow as
 * CourseSlugAlreadyTakenError so the application layer stays free of Prisma types.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Course } from '../domain/course/course';
import { CourseSlugAlreadyTakenError } from '../domain/course/course.errors';

import type { CourseRepository } from '../domain/course/course.repository';
import type { CourseId } from '../domain/course/course';

/** Shape of a course row returned by Prisma with sections included. */
interface CourseRow {
  id: string;
  libraryId: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  sections: { id: string; courseId: string; position: number; title: string }[];
}

const COURSE_WITH_SECTIONS_SELECT = {
  id: true,
  libraryId: true,
  slug: true,
  title: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  sections: {
    select: { id: true, courseId: true, position: true, title: true },
    orderBy: { position: 'asc' as const },
  },
} as const;

@Injectable()
export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(course: Course): Promise<void> {
    try {
      // WHY $transaction: course + sections must land atomically so a partial
      // write (course row present, sections missing) never enters the DB.
      // Delete-and-recreate for sections is acceptable in v1 because concurrent
      // section edits go through the aggregate serialiser and because section
      // counts are small.
      await this.prisma.$transaction(async (tx) => {
        await tx.course.upsert({
          where: { id: course.id },
          create: {
            id: course.id,
            libraryId: course.libraryId,
            slug: course.slug,
            title: course.title,
            description: course.description ?? null,
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
          },
          update: {
            slug: course.slug,
            title: course.title,
            description: course.description ?? null,
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
    return this.rowToAggregate(row);
  }

  async findManyByLibrary(libraryId: string): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      where: { libraryId },
      select: COURSE_WITH_SECTIONS_SELECT,
      orderBy: { title: 'asc' },
    });

    return rows.map((r: CourseRow) => this.rowToAggregate(r));
  }

  async findAll(): Promise<Course[]> {
    const rows = await this.prisma.course.findMany({
      select: COURSE_WITH_SECTIONS_SELECT,
      orderBy: { title: 'asc' },
    });

    return rows.map((r: CourseRow) => this.rowToAggregate(r));
  }

  async findByIds(ids: string[]): Promise<Course[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.course.findMany({
      where: { id: { in: ids } },
      select: COURSE_WITH_SECTIONS_SELECT,
    });

    return rows.map((r: CourseRow) => this.rowToAggregate(r));
  }

  // ---------------------------------------------------------------------------
  // Private mapper — row shape → domain aggregate
  // ---------------------------------------------------------------------------
  private rowToAggregate(row: CourseRow): Course {
    return Course.reconstitute({
      id: row.id as CourseId,
      libraryId: row.libraryId,
      slug: row.slug,
      title: row.title,
      description: row.description ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      sections: row.sections.map((s) => ({
        id: s.id,
        position: s.position,
        title: s.title,
      })),
    });
  }
}

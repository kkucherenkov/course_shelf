/**
 * WHY this file exists:
 * Prisma adapter that implements the SearchPort. All raw SQL-ish concerns live
 * here; the handler sees only the clean SearchPort interface.
 *
 * Course hits:
 *   Uses a single Prisma `findMany` with an `OR` clause:
 *     title ILIKE %q%   OR   sections: { some: { title ILIKE %q% } }
 *   Prisma compiles this to an EXISTS subquery per condition — the result is
 *   already distinct on course id (findMany on the course table returns one row
 *   per course). lessonsTotal is derived via a follow-up `groupBy` on lesson
 *   (same bulk pattern used by other handlers — no N+1).
 *
 * Lesson hits:
 *   Single `findMany` on the lesson table with `title ILIKE %q%`. The `section`
 *   relation (course title + section title) is included via `select` so we
 *   avoid any N+1 fan-out.
 *
 * Library filter:
 *   When libraryIds !== null a `libraryId: { in: libraryIds }` clause is added
 *   to both queries so only accessible courses/lessons are returned.
 *
 * Ranking:
 *   DB-level ORDER BY is intentionally omitted here beyond a simple title asc
 *   tiebreaker — the handler applies multi-tier JS ranking
 *   (prefix > word-start > substring, then alpha) after the fetch.
 *   Result sets are capped at `limit * 2` from the DB (max 200 rows) so JS
 *   ranking has negligible cost.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type { SearchPort, SearchCourseHitRow, SearchLessonHitRow } from '../domain/search.port';

@Injectable()
export class PrismaSearchAdapter implements SearchPort {
  constructor(private readonly prisma: PrismaService) {}

  async findCourseHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchCourseHitRow[]> {
    // Build the where clause: match on course title OR any section title.
    const titleOrSection = {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { sections: { some: { title: { contains: q, mode: 'insensitive' as const } } } },
      ],
    };

    const where =
      libraryIds === null
        ? titleOrSection
        : { AND: [titleOrSection, { libraryId: { in: libraryIds } }] };

    const rows = await this.prisma.course.findMany({
      where,
      select: {
        id: true,
        libraryId: true,
        title: true,
        slug: true,
      },
      // Fetch a larger candidate pool so JS ranking can pick the best `limit` hits
      // even when some rows were matched via section title only.
      take: limit * 2,
      orderBy: { title: 'asc' },
    });

    if (rows.length === 0) return [];

    // Bulk-fetch lesson counts in one groupBy — same pattern as findRecentlyAdded.
    const courseIds = rows.map((r) => r.id);
    const lessonCounts = await this.prisma.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { id: true },
    });

    const countMap = new Map(lessonCounts.map((lc) => [lc.courseId, lc._count.id]));

    return rows.map((r) => ({
      id: r.id,
      libraryId: r.libraryId,
      title: r.title,
      slug: r.slug,
      lessonsTotal: countMap.get(r.id) ?? 0,
    }));
  }

  async findLessonHits(
    q: string,
    limit: number,
    libraryIds: string[] | null,
  ): Promise<SearchLessonHitRow[]> {
    const lessonWhere =
      libraryIds === null
        ? { title: { contains: q, mode: 'insensitive' as const } }
        : {
            title: { contains: q, mode: 'insensitive' as const },
            section: { course: { libraryId: { in: libraryIds } } },
          };

    const rows = await this.prisma.lesson.findMany({
      where: lessonWhere,
      select: {
        id: true,
        courseId: true,
        position: true,
        title: true,
        section: {
          select: {
            title: true,
            course: {
              select: { title: true },
            },
          },
        },
      },
      take: limit * 2,
      orderBy: { title: 'asc' },
    });

    return rows.map((r) => ({
      id: r.id,
      courseId: r.courseId,
      courseTitle: r.section.course.title,
      sectionTitle: r.section.title,
      title: r.title,
      position: r.position,
    }));
  }
}

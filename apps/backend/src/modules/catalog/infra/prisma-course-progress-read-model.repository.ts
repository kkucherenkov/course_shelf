/**
 * WHY this file exists:
 * Prisma adapter that implements the CourseProgressReadModelRepository port. It
 * is the only place in the Catalog bounded context that reads or writes the
 * `course_progress_read_model` table. All other layers depend only on the port.
 *
 * upsert() uses the composite unique constraint (userId, courseId) as the
 * conflict target so callers do not need to track whether a row already exists.
 * Running the same event twice produces the same final state (idempotent).
 *
 * findManyByUser() orders by lastSeenAt DESC so the continue-watching query
 * handler can slice without a secondary sort.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { CourseProgressReadModel } from '../domain/progress/course-progress-read-model';

import type { CourseProgressReadModelRepository } from '../domain/progress/course-progress-read-model.repository';

interface ProgressRow {
  id: string;
  userId: string;
  courseId: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  percent: number;
  lastSeenAt: Date;
  lastSeenLessonId: string;
}

const SELECT = {
  id: true,
  userId: true,
  courseId: true,
  lessonsCompleted: true,
  lessonsTotal: true,
  percent: true,
  lastSeenAt: true,
  lastSeenLessonId: true,
} as const;

function rowToModel(row: ProgressRow): CourseProgressReadModel {
  return CourseProgressReadModel.reconstitute({
    id: row.id,
    userId: row.userId,
    courseId: row.courseId,
    lessonsCompleted: row.lessonsCompleted,
    lessonsTotal: row.lessonsTotal,
    percent: row.percent,
    lastSeenAt: row.lastSeenAt,
    lastSeenLessonId: row.lastSeenLessonId,
  });
}

@Injectable()
export class PrismaCourseProgressReadModelRepository implements CourseProgressReadModelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(model: CourseProgressReadModel): Promise<void> {
    await this.prisma.courseProgressReadModel.upsert({
      where: {
        uq_course_progress_user_course: {
          userId: model.userId,
          courseId: model.courseId,
        },
      },
      create: {
        id: model.id,
        userId: model.userId,
        courseId: model.courseId,
        lessonsCompleted: model.lessonsCompleted,
        lessonsTotal: model.lessonsTotal,
        percent: model.percent,
        lastSeenAt: model.lastSeenAt,
        lastSeenLessonId: model.lastSeenLessonId,
      },
      update: {
        lessonsCompleted: model.lessonsCompleted,
        lessonsTotal: model.lessonsTotal,
        percent: model.percent,
        lastSeenAt: model.lastSeenAt,
        lastSeenLessonId: model.lastSeenLessonId,
      },
    });
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressReadModel | null> {
    const row = await this.prisma.courseProgressReadModel.findUnique({
      where: {
        uq_course_progress_user_course: { userId, courseId },
      },
      select: SELECT,
    });

    if (!row) return null;
    return rowToModel(row);
  }

  async findManyByUser(userId: string): Promise<CourseProgressReadModel[]> {
    const rows = await this.prisma.courseProgressReadModel.findMany({
      where: { userId },
      select: SELECT,
      orderBy: { lastSeenAt: 'desc' },
    });

    return rows.map((r: ProgressRow) => rowToModel(r));
  }

  async findManyByCourseIdsForUser(
    userId: string,
    courseIds: string[],
  ): Promise<CourseProgressReadModel[]> {
    if (courseIds.length === 0) return [];

    const rows = await this.prisma.courseProgressReadModel.findMany({
      where: { userId, courseId: { in: courseIds } },
      select: SELECT,
    });

    return rows.map((r: ProgressRow) => rowToModel(r));
  }

  async deleteAll(): Promise<void> {
    await this.prisma.courseProgressReadModel.deleteMany();
  }

  async findCompletedByUser(userId: string, limit: number): Promise<CourseProgressReadModel[]> {
    const rows = await this.prisma.courseProgressReadModel.findMany({
      where: {
        userId,
        lessonsTotal: { gt: 0 },
        // Prisma does not support a column-to-column comparison directly in
        // the filter DSL; use $queryRaw would require raw SQL. Instead we fetch
        // rows where lessonsTotal > 0 ordered by lastSeenAt DESC with a
        // generous take (limit * 3) and filter in-process. The completion
        // check (lessonsCompleted == lessonsTotal) is a single equality check
        // that is cheap in JS and avoids a raw query.
      },
      select: SELECT,
      orderBy: { lastSeenAt: 'desc' },
      take: limit * 3,
    });

    return rows
      .filter((r: ProgressRow) => r.lessonsCompleted === r.lessonsTotal)
      .slice(0, limit)
      .map((r: ProgressRow) => rowToModel(r));
  }

  async deleteByUserAndCourse(userId: string, courseId: string): Promise<void> {
    await this.prisma.courseProgressReadModel.deleteMany({
      where: { userId, courseId },
    });
  }
}

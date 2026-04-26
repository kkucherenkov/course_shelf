/**
 * WHY this file exists:
 * Prisma adapter that implements the LessonProgressRepository port. It is the
 * only file in the Learning bounded context that depends on PrismaService. All
 * other layers depend only on the port interface, keeping them testable without
 * a real DB.
 *
 * save() uses upsert on the composite unique key (userId, lessonId) so callers
 * don't need to distinguish between insert and update — the aggregate is the
 * source of truth and the DB reflects its current state.
 *
 * completedAt boundary: the aggregate stores undefined when not yet completed;
 * Prisma requires null in the DB. The mapper converts in both directions.
 *
 * countCompletedByUserAndCourse() and findAllUserCoursePairs() join through the
 * lesson table (lesson_progress has lessonId but not courseId) via $queryRaw.
 * Prisma's type-safe query builder does not support cross-table aggregates
 * without a relation declared in the schema; $queryRaw is the pragmatic choice
 * for these two narrow projection-support methods.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { LessonProgress } from '../domain/progress/lesson-progress';

import type { LessonProgressRepository } from '../domain/progress/lesson-progress.repository';

// Minimal row shape for the lessonProgress table (select projection).
interface LessonProgressRow {
  id: string;
  userId: string;
  lessonId: string;
  positionSeconds: number;
  durationSeconds: number;
  percent: number;
  completed: boolean;
  lastSeenAt: Date;
  completedAt: Date | null;
  createdAt: Date;
}

function rowToAggregate(row: LessonProgressRow): LessonProgress {
  return LessonProgress.reconstitute({
    id: row.id,
    userId: row.userId,
    lessonId: row.lessonId,
    positionSeconds: row.positionSeconds,
    durationSeconds: row.durationSeconds,
    percent: row.percent,
    completed: row.completed,
    lastSeenAt: row.lastSeenAt,
    // null → undefined at the domain boundary
    completedAt: row.completedAt ?? undefined,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaLessonProgressRepository implements LessonProgressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(progress: LessonProgress): Promise<void> {
    // undefined → null at the Prisma boundary
    const completedAt = progress.completedAt ?? null;

    await this.prisma.lessonProgress.upsert({
      where: {
        uq_lesson_progress_user_lesson: {
          userId: progress.userId,
          lessonId: progress.lessonId,
        },
      },
      create: {
        id: progress.id,
        userId: progress.userId,
        lessonId: progress.lessonId,
        positionSeconds: progress.positionSeconds,
        durationSeconds: progress.durationSeconds,
        percent: progress.percent,
        completed: progress.completed,
        lastSeenAt: progress.lastSeenAt,
        completedAt,
      },
      update: {
        positionSeconds: progress.positionSeconds,
        durationSeconds: progress.durationSeconds,
        percent: progress.percent,
        completed: progress.completed,
        lastSeenAt: progress.lastSeenAt,
        completedAt,
      },
    });
  }

  async findByUserAndLesson(userId: string, lessonId: string): Promise<LessonProgress | null> {
    const row = await this.prisma.lessonProgress.findUnique({
      where: {
        uq_lesson_progress_user_lesson: { userId, lessonId },
      },
      select: {
        id: true,
        userId: true,
        lessonId: true,
        positionSeconds: true,
        durationSeconds: true,
        percent: true,
        completed: true,
        lastSeenAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    if (!row) return null;

    return rowToAggregate(row);
  }

  /**
   * Count lessons the user has completed within a course. Joins lesson_progress
   * to lesson via lessonId. Uses $queryRaw because Prisma's typed client does
   * not support cross-table aggregates without a schema relation.
   *
   * Idempotent: can be called repeatedly; always returns the current DB count.
   */
  async countCompletedByUserAndCourse(userId: string, courseId: string): Promise<number> {
    const result = await this.prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(lp.id) AS count
        FROM lesson_progress lp
        JOIN lesson l ON l.id = lp."lessonId"
        WHERE lp."userId" = ${userId}
          AND l."courseId" = ${courseId}
          AND lp.completed = true
      `,
    );
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Return every distinct (userId, courseId) pair that has at least one
   * LessonProgress row. Joins through the lesson table.
   * Used exclusively by the rebuild-projections script.
   */
  async findAllUserCoursePairs(): Promise<{ userId: string; courseId: string }[]> {
    const rows = await this.prisma.$queryRaw<{ userId: string; courseId: string }[]>(
      Prisma.sql`
        SELECT DISTINCT lp."userId", l."courseId"
        FROM lesson_progress lp
        JOIN lesson l ON l.id = lp."lessonId"
      `,
    );
    return rows;
  }

  /**
   * Return the most recent LessonProgress row (highest lastSeenAt) for a
   * (userId, courseId) pair. Joins through the lesson table.
   * Returns null when no rows exist.
   */
  async findLatestByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<{ lessonId: string; lastSeenAt: Date } | null> {
    const rows = await this.prisma.$queryRaw<{ lessonId: string; lastSeenAt: Date }[]>(
      Prisma.sql`
        SELECT lp."lessonId", lp."lastSeenAt"
        FROM lesson_progress lp
        JOIN lesson l ON l.id = lp."lessonId"
        WHERE lp."userId" = ${userId}
          AND l."courseId" = ${courseId}
        ORDER BY lp."lastSeenAt" DESC
        LIMIT 1
      `,
    );
    return rows[0] ?? null;
  }
}

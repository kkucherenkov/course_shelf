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
 */
import { Injectable } from '@nestjs/common';

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
}

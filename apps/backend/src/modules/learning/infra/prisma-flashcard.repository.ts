/**
 * WHY this file exists:
 * Prisma adapter that implements the FlashcardRepository port. It is the
 * only file in the Learning bounded context's flashcard slice that depends
 * on PrismaService. All other layers depend only on the port interface.
 *
 * The review schedule (easeFactor, intervalDays, repetitions, dueAt) lives
 * as columns on the same row — see schema.prisma for why. save() always
 * writes the full schedule so a grade transition persists in one upsert.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Flashcard } from '../domain/flashcard/flashcard';

import type { FlashcardRepository } from '../domain/flashcard/flashcard.repository';

// Minimal row shape for the flashcard table (select projection).
interface FlashcardRow {
  id: string;
  userId: string;
  lessonId: string;
  front: string;
  back: string;
  sourceCueId: string | null;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  dueAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SELECT = {
  id: true,
  userId: true,
  lessonId: true,
  front: true,
  back: true,
  sourceCueId: true,
  easeFactor: true,
  intervalDays: true,
  repetitions: true,
  dueAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function rowToAggregate(row: FlashcardRow): Flashcard {
  return Flashcard.reconstitute({
    id: row.id,
    userId: row.userId,
    lessonId: row.lessonId,
    front: row.front,
    back: row.back,
    // null → undefined at the domain boundary
    sourceCueId: row.sourceCueId ?? undefined,
    schedule: {
      easeFactor: row.easeFactor,
      intervalDays: row.intervalDays,
      repetitions: row.repetitions,
      dueAt: row.dueAt,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaFlashcardRepository implements FlashcardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(flashcard: Flashcard): Promise<void> {
    // undefined → null at the Prisma boundary
    const sourceCueId = flashcard.sourceCueId ?? null;

    await this.prisma.flashcard.upsert({
      where: { id: flashcard.id },
      create: {
        id: flashcard.id,
        userId: flashcard.userId,
        lessonId: flashcard.lessonId,
        front: flashcard.front,
        back: flashcard.back,
        sourceCueId,
        easeFactor: flashcard.schedule.easeFactor,
        intervalDays: flashcard.schedule.intervalDays,
        repetitions: flashcard.schedule.repetitions,
        dueAt: flashcard.schedule.dueAt,
      },
      update: {
        front: flashcard.front,
        back: flashcard.back,
        easeFactor: flashcard.schedule.easeFactor,
        intervalDays: flashcard.schedule.intervalDays,
        repetitions: flashcard.schedule.repetitions,
        dueAt: flashcard.schedule.dueAt,
      },
    });
  }

  async findById(id: string): Promise<Flashcard | null> {
    const row = await this.prisma.flashcard.findUnique({ where: { id }, select: SELECT });
    if (!row) return null;
    return rowToAggregate(row);
  }

  async findManyByUserAndLesson(userId: string, lessonId: string): Promise<Flashcard[]> {
    const rows = await this.prisma.flashcard.findMany({
      where: { userId, lessonId },
      select: SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => rowToAggregate(row));
  }

  async findDueByUser(userId: string, now: Date, limit: number): Promise<Flashcard[]> {
    const rows = await this.prisma.flashcard.findMany({
      where: { userId, dueAt: { lte: now } },
      select: SELECT,
      orderBy: { dueAt: 'asc' },
      take: limit,
    });
    return rows.map((row) => rowToAggregate(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.flashcard.delete({ where: { id } });
  }
}

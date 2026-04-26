/**
 * WHY this file exists:
 * Prisma adapter that implements the NoteRepository port. It is the only
 * file in the Learning bounded context's note slice that depends on
 * PrismaService. All other layers depend only on the port interface.
 *
 * upsert() uses the composite unique index name `uq_note_user_lesson`
 * (defined in schema.prisma) as the where clause — same pattern as
 * PrismaLessonProgressRepository.
 *
 * deleteByUserAndLesson() issues a deleteMany and returns true when one
 * row was actually deleted, false when none matched (idempotent from the
 * caller's perspective).
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Note } from '../domain/note/note';

import type { NoteRepository } from '../domain/note/note.repository';

// Minimal row shape for the note table (select projection).
interface NoteRow {
  id: string;
  userId: string;
  lessonId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const SELECT = {
  id: true,
  userId: true,
  lessonId: true,
  body: true,
  createdAt: true,
  updatedAt: true,
} as const;

function rowToAggregate(row: NoteRow): Note {
  return Note.reconstitute({
    id: row.id,
    userId: row.userId,
    lessonId: row.lessonId,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaNoteRepository implements NoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(note: Note): Promise<void> {
    await this.prisma.note.upsert({
      where: {
        uq_note_user_lesson: {
          userId: note.userId,
          lessonId: note.lessonId,
        },
      },
      create: {
        id: note.id,
        userId: note.userId,
        lessonId: note.lessonId,
        body: note.body,
      },
      update: {
        body: note.body,
      },
    });
  }

  async findByUserAndLesson(userId: string, lessonId: string): Promise<Note | null> {
    const row = await this.prisma.note.findUnique({
      where: {
        uq_note_user_lesson: { userId, lessonId },
      },
      select: SELECT,
    });
    if (!row) return null;
    return rowToAggregate(row);
  }

  async deleteByUserAndLesson(userId: string, lessonId: string): Promise<boolean> {
    const result = await this.prisma.note.deleteMany({
      where: { userId, lessonId },
    });
    return result.count > 0;
  }
}

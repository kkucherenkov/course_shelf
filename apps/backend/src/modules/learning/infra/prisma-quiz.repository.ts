/**
 * WHY this file exists:
 * Prisma adapter implementing QuizRepository. The jsonb `questions` column
 * round-trips as a plain array; on read it is cast back to its domain type
 * (the DB is the source of truth, written only by this app). No relation to
 * Lesson/Course — mirrors PrismaFlashcardRepository, not
 * PrismaIdentifyTaskRepository: learning does not declare a cross-context FK.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Quiz } from '../domain/quiz/quiz';

import type { QuizQuestion, QuizStatus } from '../domain/quiz/quiz';
import type { QuizRepository } from '../domain/quiz/quiz.repository';

interface QuizRow {
  id: string;
  lessonId: string;
  courseId: string;
  status: string;
  modelFilename: string;
  questions: unknown;
  createdAt: Date;
  completedAt: Date | null;
}

export function quizRowToDomain(row: QuizRow): Quiz {
  return Quiz.reconstitute({
    id: row.id,
    lessonId: row.lessonId,
    courseId: row.courseId,
    status: row.status as QuizStatus,
    modelFilename: row.modelFilename,
    questions: row.questions as readonly QuizQuestion[],
    createdAt: row.createdAt,
    ...(row.completedAt === null ? {} : { completedAt: row.completedAt }),
  });
}

@Injectable()
export class PrismaQuizRepository implements QuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(quiz: Quiz): Promise<void> {
    const data = {
      lessonId: quiz.lessonId,
      courseId: quiz.courseId,
      status: quiz.status,
      modelFilename: quiz.modelFilename,
      questions: quiz.questions as object,
      completedAt: quiz.completedAt ?? null,
    };
    await this.prisma.quiz.upsert({
      where: { id: quiz.id },
      create: { id: quiz.id, createdAt: quiz.createdAt, ...data },
      update: data,
    });
  }

  async findById(id: string): Promise<Quiz | null> {
    const row = await this.prisma.quiz.findUnique({ where: { id } });
    return row ? quizRowToDomain(row) : null;
  }

  async findMany(filter: {
    status?: QuizStatus;
    lessonId?: string;
    courseId?: string;
  }): Promise<Quiz[]> {
    const rows = await this.prisma.quiz.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.lessonId ? { lessonId: filter.lessonId } : {}),
        ...(filter.courseId ? { courseId: filter.courseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => quizRowToDomain(row));
  }
}

/**
 * WHY this file exists:
 * Port (interface + Symbol token) for Quiz persistence. The application layer
 * depends only on this; PrismaQuizRepository implements it and is bound by the
 * token in LearningModule.
 *
 *   Token:   QUIZ_REPOSITORY
 *   Port:    QuizRepository
 *   Adapter: PrismaQuizRepository (infra/prisma-quiz.repository.ts)
 */
import type { Quiz, QuizStatus } from './quiz';

export const QUIZ_REPOSITORY = Symbol('QUIZ_REPOSITORY');

export interface QuizRepository {
  /** Insert or update the quiz row (jsonb questions serialized). */
  save(quiz: Quiz): Promise<void>;

  /** Return the quiz by id, or null when not found. */
  findById(id: string): Promise<Quiz | null>;

  /**
   * List quizzes newest-first, optionally narrowed by status, lessonId and/or
   * courseId. Filters are AND-combined when present.
   */
  findMany(filter: { status?: QuizStatus; lessonId?: string; courseId?: string }): Promise<Quiz[]>;
}

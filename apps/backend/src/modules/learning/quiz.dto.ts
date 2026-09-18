/**
 * WHY this file exists:
 * Maps the Quiz aggregate to its OpenAPI DTO. Dates serialize to ISO
 * strings; `questions` passes through unchanged (the domain shape already
 * matches the generated DTO shape) — mirrors catalog's identify.dto.ts.
 */
import type { Quiz } from './domain/quiz/quiz';
import type { QuizDto } from '@app/api-client-ts';

export function toQuizDto(quiz: Quiz): QuizDto {
  return {
    id: quiz.id,
    lessonId: quiz.lessonId,
    courseId: quiz.courseId,
    status: quiz.status,
    model: quiz.model,
    questions: quiz.questions.map((q) => ({
      prompt: q.prompt,
      options: [...q.options] as [string, string, string, string],
      correctOptionIndex: q.correctOptionIndex,
      cueStartMs: q.cueStartMs,
    })),
    createdAt: quiz.createdAt.toISOString(),
    ...(quiz.completedAt === undefined ? {} : { completedAt: quiz.completedAt.toISOString() }),
  };
}

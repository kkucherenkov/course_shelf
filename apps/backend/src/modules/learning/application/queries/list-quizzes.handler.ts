/**
 * WHY this file exists:
 * Read-side handler listing quizzes (newest first) with optional status,
 * lessonId and courseId filters — the admin review surface polls this to see
 * what a course-scoped generation run has produced so far (E29-F02-S01: no
 * separate run record exists, the Quiz proposals ARE the run's visible
 * output).
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { QUIZ_REPOSITORY } from '../../domain/quiz/quiz.repository';
import { toQuizDto } from '../../quiz.dto';

import { ListQuizzesQuery } from './list-quizzes.query';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';
import type { QuizListDto } from '@app/api-client-ts';

@QueryHandler(ListQuizzesQuery)
export class ListQuizzesHandler implements IQueryHandler<ListQuizzesQuery, QuizListDto> {
  constructor(@Inject(QUIZ_REPOSITORY) private readonly quizzes: QuizRepository) {}

  async execute(query: ListQuizzesQuery): Promise<QuizListDto> {
    const quizzes = await this.quizzes.findMany({
      ...(query.status ? { status: query.status } : {}),
      ...(query.lessonId ? { lessonId: query.lessonId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    });
    return { quizzes: quizzes.map((quiz) => toQuizDto(quiz)) };
  }
}

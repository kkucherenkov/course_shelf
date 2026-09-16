/** WHY this file exists: read-side handler fetching one quiz by id. Throws QuizNotFoundError (404) when absent. */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { QuizNotFoundError } from '../../domain/quiz/quiz.errors';
import { QUIZ_REPOSITORY } from '../../domain/quiz/quiz.repository';
import { toQuizDto } from '../../quiz.dto';

import { GetQuizQuery } from './get-quiz.query';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';
import type { QuizDto } from '@app/api-client-ts';

@QueryHandler(GetQuizQuery)
export class GetQuizHandler implements IQueryHandler<GetQuizQuery, QuizDto> {
  constructor(@Inject(QUIZ_REPOSITORY) private readonly quizzes: QuizRepository) {}

  async execute(query: GetQuizQuery): Promise<QuizDto> {
    const quiz = await this.quizzes.findById(query.id);
    if (!quiz) throw new QuizNotFoundError(query.id);
    return toQuizDto(quiz);
  }
}

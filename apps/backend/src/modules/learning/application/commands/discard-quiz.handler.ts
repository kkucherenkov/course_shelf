/**
 * WHY this file exists:
 * Discards a proposed Quiz. No event — discard is not an audit-worthy
 * mutation of real data, same reasoning as catalog's DiscardIdentifyTaskHandler.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { QuizNotFoundError } from '../../domain/quiz/quiz.errors';
import { QUIZ_REPOSITORY } from '../../domain/quiz/quiz.repository';
import { toQuizDto } from '../../quiz.dto';

import { DiscardQuizCommand } from './discard-quiz.command';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';
import type { QuizDto } from '@app/api-client-ts';

@CommandHandler(DiscardQuizCommand)
export class DiscardQuizHandler implements ICommandHandler<DiscardQuizCommand, QuizDto> {
  constructor(@Inject(QUIZ_REPOSITORY) private readonly quizzes: QuizRepository) {}

  async execute(command: DiscardQuizCommand): Promise<QuizDto> {
    const quiz = await this.quizzes.findById(command.quizId);
    if (!quiz) throw new QuizNotFoundError(command.quizId);
    quiz.markDiscarded(new Date());
    await this.quizzes.save(quiz);
    return toQuizDto(quiz);
  }
}

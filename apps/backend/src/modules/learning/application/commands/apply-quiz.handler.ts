/**
 * WHY this file exists:
 * Applies a proposed Quiz. No downstream write (see ApplyQuizCommand) — loads,
 * transitions, saves, publishes QuizApplied. The aggregate enforces the
 * `proposed`-state invariant.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { QuizNotFoundError } from '../../domain/quiz/quiz.errors';
import { QuizApplied } from '../../domain/quiz/quiz.events';
import { QUIZ_REPOSITORY } from '../../domain/quiz/quiz.repository';
import { toQuizDto } from '../../quiz.dto';

import { ApplyQuizCommand } from './apply-quiz.command';

import type { QuizRepository } from '../../domain/quiz/quiz.repository';
import type { QuizDto } from '@app/api-client-ts';

@CommandHandler(ApplyQuizCommand)
export class ApplyQuizHandler implements ICommandHandler<ApplyQuizCommand, QuizDto> {
  constructor(
    @Inject(QUIZ_REPOSITORY) private readonly quizzes: QuizRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApplyQuizCommand): Promise<QuizDto> {
    const quiz = await this.quizzes.findById(command.quizId);
    if (!quiz) throw new QuizNotFoundError(command.quizId);

    const now = new Date();
    quiz.markApplied(now);
    await this.quizzes.save(quiz);
    this.eventBus.publish(new QuizApplied(quiz.id, quiz.lessonId, command.actorId, now));
    return toQuizDto(quiz);
  }
}

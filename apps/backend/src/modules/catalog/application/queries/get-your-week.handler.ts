/**
 * WHY this file exists:
 * Query handler for GET /home/your-week. Returns a roll-up of the requester's
 * activity over the trailing seven days.
 *
 * Window: [now - 7d, now) — half-open, computed once at the top of execute().
 * Using a single new Date() ensures from and to are consistent even if the
 * wall clock ticks between two calls.
 *
 * minutesWatched: SUM(positionSeconds) for LessonProgress rows whose updatedAt
 * falls in the window, divided by 60 and floored. positionSeconds is the
 * player-reported position — the best available proxy for elapsed watch time.
 * (durationSeconds is the lesson length, not elapsed time; using it would
 * over-count for partially-watched lessons.)
 *
 * lessonsCompleted: COUNT of rows where completedAt IS NOT NULL and completedAt
 * is in [from, to).
 *
 * Both values are 0 for new users with no progress rows.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';

import { GetYourWeekQuery } from './get-your-week.query';

import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { YourWeekDto } from '@app/api-client-ts';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@QueryHandler(GetYourWeekQuery)
export class GetYourWeekHandler implements IQueryHandler<GetYourWeekQuery, YourWeekDto> {
  constructor(
    @Inject(LESSON_PROGRESS_REPOSITORY)
    private readonly lessonProgressRepo: LessonProgressRepository,
  ) {}

  async execute(query: GetYourWeekQuery): Promise<YourWeekDto> {
    const { actor } = query;

    // Window: [now - 7d, now) — computed once so from and to are consistent.
    const to = new Date();
    const from = new Date(to.getTime() - SEVEN_DAYS_MS);

    const { minutesWatched, lessonsCompleted } =
      await this.lessonProgressRepo.aggregateForUserRange(actor.id, from, to);

    return {
      minutesWatched,
      lessonsCompleted,
      range: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    };
  }
}

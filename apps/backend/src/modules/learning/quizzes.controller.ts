/**
 * WHY this file exists:
 * Admin review surface for generated quiz proposals — list/get/apply/discard,
 * shaped exactly like catalog's IdentifyAdminController's review endpoints,
 * minus the `/admin` path prefix (this mirrors the transcription family's
 * routing instead, per the maintainer's explicit call: the resource itself
 * — `/quizzes` — carries the admin guard, not an `/admin/` path segment).
 */
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { ApplyQuizCommand } from './application/commands/apply-quiz.command';
import { DiscardQuizCommand } from './application/commands/discard-quiz.command';
import { GetQuizQuery } from './application/queries/get-quiz.query';
import { ListQuizzesQuery } from './application/queries/list-quizzes.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { QuizStatus } from './domain/quiz/quiz';
import type { QuizDto, QuizListDto } from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'quizzes', version: '1' })
export class QuizzesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** GET /api/v1/quizzes?status=&lessonId=&courseId= */
  @Get()
  async list(
    @Query('status') status?: string,
    @Query('lessonId') lessonId?: string,
    @Query('courseId') courseId?: string,
  ): Promise<QuizListDto> {
    return this.queryBus.execute<ListQuizzesQuery, QuizListDto>(
      new ListQuizzesQuery(status as QuizStatus | undefined, lessonId, courseId),
    );
  }

  /** GET /api/v1/quizzes/:id */
  @Get(':id')
  async get(@Param('id') id: string): Promise<QuizDto> {
    return this.queryBus.execute<GetQuizQuery, QuizDto>(new GetQuizQuery(id));
  }

  /** POST /api/v1/quizzes/:id/apply */
  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  async apply(@Param('id') id: string, @Session() session: SessionContext): Promise<QuizDto> {
    return this.commandBus.execute<ApplyQuizCommand, QuizDto>(
      new ApplyQuizCommand(id, session.user.id),
    );
  }

  /** POST /api/v1/quizzes/:id/discard */
  @Post(':id/discard')
  @HttpCode(HttpStatus.OK)
  async discard(@Param('id') id: string): Promise<QuizDto> {
    return this.commandBus.execute<DiscardQuizCommand, QuizDto>(new DiscardQuizCommand(id));
  }
}

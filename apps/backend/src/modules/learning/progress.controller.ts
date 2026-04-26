/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's progress slice. Its only jobs:
 *   1. Extract the actor from @Session() — resolved by the global SessionGuard.
 *   2. Dispatch a Command or Query via the CQRS bus.
 *   3. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no domain mapping here.
 */
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { Session } from '../../common/auth/decorators';
import { RecordProgressBatchCommand } from './application/commands/record-progress-batch.command';
import { RecordProgressCommand } from './application/commands/record-progress.command';
import { GetLessonProgressQuery } from './application/queries/get-lesson-progress.query';

import type { SessionContext } from '../../common/auth/decorators';
import type {
  BatchProgressRequest,
  BatchProgressResponse,
  LessonProgressDto,
  RecordProgressRequest,
} from '@app/api-client-ts';

@Controller({ path: 'progress', version: '1' })
export class ProgressController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** POST /api/v1/progress/batch */
  @Post('batch')
  async recordProgressBatch(
    @Body() body: BatchProgressRequest,
    @Session() session: SessionContext,
  ): Promise<BatchProgressResponse> {
    const actor = session.user;
    return this.commandBus.execute<RecordProgressBatchCommand, BatchProgressResponse>(
      new RecordProgressBatchCommand(
        body.items.map((it) => ({
          lessonId: it.lessonId,
          positionSeconds: it.positionSeconds,
          durationSeconds: it.durationSeconds,
          clientUpdatedAt: new Date(it.clientUpdatedAt),
        })),
        actor,
      ),
    );
  }

  /** POST /api/v1/progress */
  @Post()
  async recordProgress(
    @Body() body: RecordProgressRequest,
    @Session() session: SessionContext,
  ): Promise<LessonProgressDto> {
    const actor = session.user;
    return this.commandBus.execute<RecordProgressCommand, LessonProgressDto>(
      new RecordProgressCommand(
        body.lessonId,
        body.positionSeconds,
        body.durationSeconds,
        new Date(body.clientUpdatedAt),
        actor,
      ),
    );
  }

  /** GET /api/v1/progress/:lessonId */
  @Get(':lessonId')
  async getLessonProgress(
    @Param('lessonId') lessonId: string,
    @Session() session: SessionContext,
  ): Promise<LessonProgressDto> {
    const actor = session.user;
    return this.queryBus.execute<GetLessonProgressQuery, LessonProgressDto>(
      new GetLessonProgressQuery(lessonId, actor),
    );
  }
}

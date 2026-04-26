/**
 * WHY this file exists:
 * HTTP entry point for the Learning bounded context's progress slice. Its only jobs:
 *   1. Resolve session → actor (id + role).
 *   2. Dispatch a Command or Query via the CQRS bus.
 *   3. Return the result typed as the OpenAPI-specified response.
 *
 * No business logic, no Prisma, no domain mapping here.
 * The only HTTP exceptions allowed in a controller are UnauthorizedException (401)
 * on missing session. All domain errors are thrown by handlers and translated
 * by HttpExceptionFilter.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { SessionGuard } from '../../common/auth/auth.guard';
import { AuthService } from '../../common/auth/auth.service';
import { RecordProgressCommand } from './application/commands/record-progress.command';
import { GetLessonProgressQuery } from './application/queries/get-lesson-progress.query';

import type { Request } from 'express';
import type { LessonProgressDto, RecordProgressRequest } from '@app/api-client-ts';

@UseGuards(SessionGuard)
@Controller({ path: 'progress', version: '1' })
export class ProgressController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly auth: AuthService,
  ) {}

  private async resolveActor(req: Request): Promise<{ id: string; role: string }> {
    const session = await this.auth.getSession(req);
    if (!session?.user) {
      throw new UnauthorizedException('Authentication required.');
    }
    const raw = (session.user as unknown as Record<string, unknown>)['role'];
    const role = typeof raw === 'string' ? raw : 'user';
    return { id: session.user.id, role };
  }

  /** POST /api/v1/progress */
  @Post()
  async recordProgress(
    @Body() body: RecordProgressRequest,
    @Req() req: Request,
  ): Promise<LessonProgressDto> {
    const actor = await this.resolveActor(req);
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
    @Req() req: Request,
  ): Promise<LessonProgressDto> {
    const actor = await this.resolveActor(req);
    return this.queryBus.execute<GetLessonProgressQuery, LessonProgressDto>(
      new GetLessonProgressQuery(lessonId, actor),
    );
  }
}

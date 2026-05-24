/**
 * WHY this file exists:
 * Admin-only HTTP entry point for the identify subsystem (Stage 4). Composition
 * only — parses the body into a validated MergePolicy, dispatches the CQRS
 * command/query, returns the OpenAPI-shaped DTO. Domain errors become RFC 9457
 * via the global filter. AdminGuard protects every route; actor comes from the
 * session for the apply audit trail.
 *
 *   POST /api/v1/admin/courses/{id}/identify           → create proposal (201)
 *   GET  /api/v1/admin/identify-tasks?status=&courseId= → list
 *   GET  /api/v1/admin/identify-tasks/{id}             → get one
 *   POST /api/v1/admin/identify-tasks/{id}/apply       → apply (200)
 *   POST /api/v1/admin/identify-tasks/{id}/discard     → discard (200)
 */
import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AdminGuard } from '../../common/auth/admin.guard';
import { Session } from '../../common/auth/decorators';
import { parseMergePolicy } from './domain/identify/merge-policy';
import { RunIdentifyTaskCommand } from './application/commands/run-identify-task.command';
import { ApplyIdentifyResultCommand } from './application/commands/apply-identify-result.command';
import { DiscardIdentifyTaskCommand } from './application/commands/discard-identify-task.command';
import { ListIdentifyTasksQuery } from './application/queries/list-identify-tasks.query';
import { GetIdentifyTaskQuery } from './application/queries/get-identify-task.query';

import type { SessionContext } from '../../common/auth/decorators';
import type { IdentifyTaskStatus } from './domain/identify/identify-task';
import type {
  ApplyIdentifyRequest,
  IdentifyTaskDto,
  IdentifyTaskListDto,
  RunIdentifyRequest,
} from '@app/api-client-ts';

@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class IdentifyAdminController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  /** POST /api/v1/admin/courses/:id/identify */
  @Post('courses/:id/identify')
  @HttpCode(201)
  async runIdentify(
    @Param('id') id: string,
    @Body() body: RunIdentifyRequest,
  ): Promise<IdentifyTaskDto> {
    const policy = parseMergePolicy(body.mergePolicy ?? undefined);
    return this.commandBus.execute<RunIdentifyTaskCommand, IdentifyTaskDto>(
      new RunIdentifyTaskCommand(
        id,
        body.source,
        body.sourceUrl ?? undefined,
        body.fragment,
        policy,
      ),
    );
  }

  /** GET /api/v1/admin/identify-tasks?status=&courseId= */
  @Get('identify-tasks')
  async listIdentify(
    @Query('status') status?: string,
    @Query('courseId') courseId?: string,
  ): Promise<IdentifyTaskListDto> {
    return this.queryBus.execute<ListIdentifyTasksQuery, IdentifyTaskListDto>(
      new ListIdentifyTasksQuery(status as IdentifyTaskStatus | undefined, courseId),
    );
  }

  /** GET /api/v1/admin/identify-tasks/:id */
  @Get('identify-tasks/:id')
  async getIdentify(@Param('id') id: string): Promise<IdentifyTaskDto> {
    return this.queryBus.execute<GetIdentifyTaskQuery, IdentifyTaskDto>(
      new GetIdentifyTaskQuery(id),
    );
  }

  /** POST /api/v1/admin/identify-tasks/:id/apply */
  @Post('identify-tasks/:id/apply')
  @HttpCode(200)
  async applyIdentify(
    @Param('id') id: string,
    @Body() body: ApplyIdentifyRequest | undefined,
    @Session() session: SessionContext,
  ): Promise<IdentifyTaskDto> {
    const policy = body?.mergePolicy ? parseMergePolicy(body.mergePolicy) : undefined;
    return this.commandBus.execute<ApplyIdentifyResultCommand, IdentifyTaskDto>(
      new ApplyIdentifyResultCommand(id, session.user, policy),
    );
  }

  /** POST /api/v1/admin/identify-tasks/:id/discard */
  @Post('identify-tasks/:id/discard')
  @HttpCode(200)
  async discardIdentify(@Param('id') id: string): Promise<IdentifyTaskDto> {
    return this.commandBus.execute<DiscardIdentifyTaskCommand, IdentifyTaskDto>(
      new DiscardIdentifyTaskCommand(id),
    );
  }
}

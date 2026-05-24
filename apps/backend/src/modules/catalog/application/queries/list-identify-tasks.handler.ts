/**
 * WHY this file exists:
 * Read-side handler listing identify tasks (newest first) with optional status
 * and courseId filters. Maps aggregates to DTOs; no writes.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { toIdentifyTaskDto } from '../../identify.dto';

import { ListIdentifyTasksQuery } from './list-identify-tasks.query';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskListDto } from '@app/api-client-ts';

@QueryHandler(ListIdentifyTasksQuery)
export class ListIdentifyTasksHandler implements IQueryHandler<
  ListIdentifyTasksQuery,
  IdentifyTaskListDto
> {
  constructor(@Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository) {}

  async execute(query: ListIdentifyTasksQuery): Promise<IdentifyTaskListDto> {
    const tasks = await this.repo.findMany({
      ...(query.status ? { status: query.status } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    });
    return { tasks: tasks.map((t) => toIdentifyTaskDto(t)) };
  }
}

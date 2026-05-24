/**
 * WHY this file exists:
 * Read-side handler fetching one identify task by id. Throws
 * IdentifyTaskNotFoundError (404) when absent.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { toIdentifyTaskDto } from '../../identify.dto';

import { GetIdentifyTaskQuery } from './get-identify-task.query';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@QueryHandler(GetIdentifyTaskQuery)
export class GetIdentifyTaskHandler implements IQueryHandler<
  GetIdentifyTaskQuery,
  IdentifyTaskDto
> {
  constructor(@Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository) {}

  async execute(query: GetIdentifyTaskQuery): Promise<IdentifyTaskDto> {
    const task = await this.repo.findById(query.id);
    if (!task) throw new IdentifyTaskNotFoundError(query.id);
    return toIdentifyTaskDto(task);
  }
}

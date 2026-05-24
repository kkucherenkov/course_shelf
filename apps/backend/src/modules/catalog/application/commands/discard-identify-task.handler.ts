/**
 * WHY this file exists:
 * Discards a proposed IdentifyTask (admin rejects the proposal). The aggregate
 * enforces the proposed-state invariant; this handler just loads, transitions,
 * and saves. No course write, no event (discard is not an audit-worthy mutation
 * of catalog data).
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { toIdentifyTaskDto } from '../../identify.dto';

import { DiscardIdentifyTaskCommand } from './discard-identify-task.command';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@CommandHandler(DiscardIdentifyTaskCommand)
export class DiscardIdentifyTaskHandler implements ICommandHandler<
  DiscardIdentifyTaskCommand,
  IdentifyTaskDto
> {
  constructor(@Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository) {}

  async execute(command: DiscardIdentifyTaskCommand): Promise<IdentifyTaskDto> {
    const task = await this.repo.findById(command.taskId);
    if (!task) throw new IdentifyTaskNotFoundError(command.taskId);
    task.markDiscarded(new Date());
    await this.repo.save(task);
    return toIdentifyTaskDto(task);
  }
}

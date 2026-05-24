/**
 * WHY this file exists:
 * Creates an IdentifyTask proposal from an already-chosen scraped fragment
 * (preview-then-commit — no scraper is invoked here). Verifies the target course
 * exists, persists the task as `proposed`, and publishes IdentifyTaskProposed.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskProposed } from '../../domain/identify/identify-task.events';
import { toIdentifyTaskDto } from '../../identify.dto';

import { RunIdentifyTaskCommand } from './run-identify-task.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@CommandHandler(RunIdentifyTaskCommand)
export class RunIdentifyTaskHandler implements ICommandHandler<
  RunIdentifyTaskCommand,
  IdentifyTaskDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(IDENTIFY_TASK_REPOSITORY) private readonly taskRepo: IdentifyTaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RunIdentifyTaskCommand): Promise<IdentifyTaskDto> {
    const course = await this.courseRepo.findById(command.courseId);
    if (!course) throw new CourseNotFoundError(command.courseId);

    const task = IdentifyTask.create({
      id: nanoid(),
      courseId: command.courseId,
      source: command.source,
      ...(command.sourceUrl === undefined ? {} : { sourceUrl: command.sourceUrl }),
      scrapedFragment: command.fragment,
      mergePolicy: command.mergePolicy,
    });
    await this.taskRepo.save(task);
    this.eventBus.publish(
      new IdentifyTaskProposed(task.id, task.courseId, task.source, task.createdAt),
    );
    return toIdentifyTaskDto(task);
  }
}

/**
 * WHY this file exists:
 * Read-side handler fetching one identify task by id. Throws
 * IdentifyTaskNotFoundError (404) when absent. Also loads the target course,
 * purely to fill the response DTO's `courseTitle` — the review page fetches
 * the full Course itself separately for the merge comparison.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { toIdentifyTaskDto } from '../../identify.dto';

import { GetIdentifyTaskQuery } from './get-identify-task.query';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@QueryHandler(GetIdentifyTaskQuery)
export class GetIdentifyTaskHandler implements IQueryHandler<
  GetIdentifyTaskQuery,
  IdentifyTaskDto
> {
  constructor(
    @Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
  ) {}

  async execute(query: GetIdentifyTaskQuery): Promise<IdentifyTaskDto> {
    const task = await this.repo.findById(query.id);
    if (!task) throw new IdentifyTaskNotFoundError(query.id);
    const course = await this.courseRepo.findById(task.courseId);
    if (!course) throw new CourseNotFoundError(task.courseId);
    return toIdentifyTaskDto(task, course.title);
  }
}

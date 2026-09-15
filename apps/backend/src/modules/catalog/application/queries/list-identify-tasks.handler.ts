/**
 * WHY this file exists:
 * Read-side handler listing identify tasks (newest first) with optional status
 * and courseId filters. Maps aggregates to DTOs; no writes. Course titles are
 * resolved with one batched lookup (`findByIds`) rather than N+1 per task.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { toIdentifyTaskDto } from '../../identify.dto';

import { ListIdentifyTasksQuery } from './list-identify-tasks.query';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskListDto } from '@app/api-client-ts';

@QueryHandler(ListIdentifyTasksQuery)
export class ListIdentifyTasksHandler implements IQueryHandler<
  ListIdentifyTasksQuery,
  IdentifyTaskListDto
> {
  constructor(
    @Inject(IDENTIFY_TASK_REPOSITORY) private readonly repo: IdentifyTaskRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
  ) {}

  async execute(query: ListIdentifyTasksQuery): Promise<IdentifyTaskListDto> {
    const tasks = await this.repo.findMany({
      ...(query.status ? { status: query.status } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
    });
    if (tasks.length === 0) return { tasks: [] };

    const courseIds = [...new Set(tasks.map((t) => t.courseId))];
    const courses = await this.courseRepo.findByIds(courseIds);
    // Explicit `string` key type — `Course.id` is branded `CourseId`, and
    // widening it here (rather than at every `.get(task.courseId)` call) is
    // the same pattern `get-continue-watching.handler.ts` uses.
    const titleById = new Map<string, string>(courses.map((c) => [c.id, c.title]));

    return {
      tasks: tasks.map((t) => toIdentifyTaskDto(t, titleById.get(t.courseId) ?? '')),
    };
  }
}

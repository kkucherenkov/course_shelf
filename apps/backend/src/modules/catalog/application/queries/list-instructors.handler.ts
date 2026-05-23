/**
 * WHY this file exists:
 * Query handler for GET /catalog/instructors. Fetches a page of instructors and
 * decorates each with its coursesTotal count.
 *
 * NOTE: the coursesTotal is fetched per-instructor (N+1). This is acceptable
 * for current list sizes (≤ 100 instructors per page). A batched count query
 * should replace this when the instructor catalogue grows large.
 * TODO: batch count
 *
 * No per-row auth check — all authenticated users can list catalog entities.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { INSTRUCTOR_REPOSITORY } from '../../domain/instructor/instructor.repository';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { toInstructorListDto } from '../../catalog-entities.dto';

import { ListInstructorsQuery } from './list-instructors.query';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { InstructorListDto } from '@app/api-client-ts';

@QueryHandler(ListInstructorsQuery)
export class ListInstructorsHandler implements IQueryHandler<
  ListInstructorsQuery,
  InstructorListDto
> {
  constructor(
    @Inject(INSTRUCTOR_REPOSITORY) private readonly repo: InstructorRepository,
    // CourseRepository injected for future batched course count — not used yet.
    @Inject(COURSE_REPOSITORY) private readonly _courseRepo: unknown,
  ) {}

  async execute(query: ListInstructorsQuery): Promise<InstructorListDto> {
    const [total, items] = await Promise.all([
      this.repo.count(query.search),
      this.repo.findManyPaginated({
        offset: query.offset,
        limit: query.limit,
        ...(query.search !== undefined && { search: query.search }),
      }),
    ]);

    // TODO: batch count — replace N+1 with a single batched query.
    const totals = new Map<string, number>();
    await Promise.all(
      items.map(async (item) => {
        const { total: courseTotal } = await this.repo.findCoursesForInstructor(item.id, {
          offset: 0,
          limit: 0,
        });
        totals.set(item.id, courseTotal);
      }),
    );

    return toInstructorListDto(items, totals, total, query.offset, query.limit);
  }
}

/**
 * WHY this file exists:
 * Query handler for GET /catalog/instructors/{slug}. Returns an
 * InstructorDetailDto containing the instructor plus a paginated slice of their
 * linked courses. No per-row auth — all authenticated users can read catalog entities.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { INSTRUCTOR_REPOSITORY } from '../../domain/instructor/instructor.repository';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { InstructorNotFoundError } from '../../domain/instructor/instructor.errors';
import { toInstructorDetailDto } from '../../catalog-entities.dto';

import { GetInstructorQuery } from './get-instructor.query';

import type { InstructorRepository } from '../../domain/instructor/instructor.repository';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { InstructorDetailDto } from '@app/api-client-ts';

@QueryHandler(GetInstructorQuery)
export class GetInstructorHandler implements IQueryHandler<
  GetInstructorQuery,
  InstructorDetailDto
> {
  constructor(
    @Inject(INSTRUCTOR_REPOSITORY) private readonly repo: InstructorRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
  ) {}

  async execute(query: GetInstructorQuery): Promise<InstructorDetailDto> {
    const instructor = await this.repo.findBySlug(query.slug);
    if (!instructor) {
      throw new InstructorNotFoundError(query.slug);
    }

    const { courseIds, total } = await this.repo.findCoursesForInstructor(instructor.id, {
      offset: query.coursesOffset,
      limit: query.coursesLimit,
    });

    const courses = courseIds.length > 0 ? await this.courseRepo.findByIds(courseIds) : [];

    return toInstructorDetailDto(instructor, total, courses);
  }
}

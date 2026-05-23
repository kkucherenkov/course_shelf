/**
 * WHY this file exists:
 * Query handler for GET /catalog/studios/{slug}. Returns a StudioDetailDto
 * containing the studio plus a paginated slice of their linked courses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { STUDIO_REPOSITORY } from '../../domain/studio/studio.repository';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { StudioNotFoundError } from '../../domain/studio/studio.errors';
import { toStudioDetailDto } from '../../catalog-entities.dto';

import { GetStudioQuery } from './get-studio.query';

import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { StudioDetailDto } from '@app/api-client-ts';

@QueryHandler(GetStudioQuery)
export class GetStudioHandler implements IQueryHandler<GetStudioQuery, StudioDetailDto> {
  constructor(
    @Inject(STUDIO_REPOSITORY) private readonly repo: StudioRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
  ) {}

  async execute(query: GetStudioQuery): Promise<StudioDetailDto> {
    const studio = await this.repo.findBySlug(query.slug);
    if (!studio) {
      throw new StudioNotFoundError(query.slug);
    }

    const { courseIds, total } = await this.repo.findCoursesForStudio(studio.id, {
      offset: query.coursesOffset,
      limit: query.coursesLimit,
    });

    const courses = courseIds.length > 0 ? await this.courseRepo.findByIds(courseIds) : [];

    return toStudioDetailDto(studio, total, courses);
  }
}

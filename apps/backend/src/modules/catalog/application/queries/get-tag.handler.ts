/**
 * WHY this file exists:
 * Query handler for GET /catalog/tags/{slug}. Returns a TagDetailDto
 * containing the tag plus a paginated slice of their linked courses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TAG_REPOSITORY } from '../../domain/tag/tag.repository';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { TagNotFoundError } from '../../domain/tag/tag.errors';
import { toTagDetailDto } from '../../catalog-entities.dto';

import { GetTagQuery } from './get-tag.query';

import type { TagRepository } from '../../domain/tag/tag.repository';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { TagDetailDto } from '@app/api-client-ts';

@QueryHandler(GetTagQuery)
export class GetTagHandler implements IQueryHandler<GetTagQuery, TagDetailDto> {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly repo: TagRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
  ) {}

  async execute(query: GetTagQuery): Promise<TagDetailDto> {
    const tag = await this.repo.findBySlug(query.slug);
    if (!tag) {
      throw new TagNotFoundError(query.slug);
    }

    const { courseIds, total } = await this.repo.findCoursesForTag(tag.id, {
      offset: query.coursesOffset,
      limit: query.coursesLimit,
    });

    const courses = courseIds.length > 0 ? await this.courseRepo.findByIds(courseIds) : [];

    return toTagDetailDto(tag, total, courses);
  }
}

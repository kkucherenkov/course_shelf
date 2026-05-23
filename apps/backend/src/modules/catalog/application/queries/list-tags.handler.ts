/**
 * WHY this file exists:
 * Query handler for GET /catalog/tags. Fetches a page of tags (optionally
 * filtered by category) and decorates each with its coursesTotal count.
 *
 * TODO: batch count — the handler currently makes N+1 findCoursesForTag
 * calls; replace with a single batched query when volume justifies it.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { TAG_REPOSITORY } from '../../domain/tag/tag.repository';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { toTagListDto } from '../../catalog-entities.dto';

import { ListTagsQuery } from './list-tags.query';

import type { TagRepository } from '../../domain/tag/tag.repository';
import type { TagListDto } from '@app/api-client-ts';

@QueryHandler(ListTagsQuery)
export class ListTagsHandler implements IQueryHandler<ListTagsQuery, TagListDto> {
  constructor(
    @Inject(TAG_REPOSITORY) private readonly repo: TagRepository,
    @Inject(COURSE_REPOSITORY) private readonly _courseRepo: unknown,
  ) {}

  async execute(query: ListTagsQuery): Promise<TagListDto> {
    const [total, items] = await Promise.all([
      this.repo.count({
        ...(query.search !== undefined && { search: query.search }),
        ...(query.category !== undefined && { category: query.category }),
      }),
      this.repo.findManyPaginated({
        offset: query.offset,
        limit: query.limit,
        ...(query.search !== undefined && { search: query.search }),
        ...(query.category !== undefined && { category: query.category }),
      }),
    ]);

    // TODO: batch count — replace N+1 with a single batched query.
    const totals = new Map<string, number>();
    await Promise.all(
      items.map(async (item) => {
        const { total: courseTotal } = await this.repo.findCoursesForTag(item.id, {
          offset: 0,
          limit: 0,
        });
        totals.set(item.id, courseTotal);
      }),
    );

    return toTagListDto(items, totals, total, query.offset, query.limit);
  }
}

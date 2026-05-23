/**
 * WHY this file exists:
 * Query handler for GET /catalog/studios. Fetches a page of studios and
 * decorates each with its coursesTotal count.
 *
 * TODO: batch count — the handler currently makes N+1 findCoursesForStudio
 * calls; replace with a single batched query when volume justifies it.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { STUDIO_REPOSITORY } from '../../domain/studio/studio.repository';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { toStudioListDto } from '../../catalog-entities.dto';

import { ListStudiosQuery } from './list-studios.query';

import type { StudioRepository } from '../../domain/studio/studio.repository';
import type { StudioListDto } from '@app/api-client-ts';

@QueryHandler(ListStudiosQuery)
export class ListStudiosHandler implements IQueryHandler<ListStudiosQuery, StudioListDto> {
  constructor(
    @Inject(STUDIO_REPOSITORY) private readonly repo: StudioRepository,
    @Inject(COURSE_REPOSITORY) private readonly _courseRepo: unknown,
  ) {}

  async execute(query: ListStudiosQuery): Promise<StudioListDto> {
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
        const { total: courseTotal } = await this.repo.findCoursesForStudio(item.id, {
          offset: 0,
          limit: 0,
        });
        totals.set(item.id, courseTotal);
      }),
    );

    return toStudioListDto(items, totals, total, query.offset, query.limit);
  }
}

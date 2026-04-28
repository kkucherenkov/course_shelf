/**
 * WHY this file exists:
 * Query handler for GET /home/recently-completed. Reads from the
 * CourseProgressReadModel projection — rows where lessonsCompleted == lessonsTotal
 * AND lessonsTotal > 0, ordered by lastSeenAt DESC (which equals completion time
 * for finished courses).
 *
 * Steps:
 *   1. Fetch completed progress rows from the projection (adapter applies filter + ordering).
 *   2. Bulk-fetch courses to resolve titles and libraryId for authz.
 *   3. Authorization filter via AuthorizationService.canSee.
 *   4. Map to RecentlyCompletedItem[].
 *
 * completedAt in the DTO maps from CourseProgressReadModel.lastSeenAt, which
 * equals the time the last lesson was completed for a fully-completed course.
 *
 * librarySlug is omitted: Library has no slug field. See continue-watching handler.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';

import { GetRecentlyCompletedQuery } from './get-recently-completed.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LibraryId } from '../../../../common/access/authorization.service';
import type { RecentlyCompletedDto, RecentlyCompletedItem } from '@app/api-client-ts';

@QueryHandler(GetRecentlyCompletedQuery)
export class GetRecentlyCompletedHandler implements IQueryHandler<
  GetRecentlyCompletedQuery,
  RecentlyCompletedDto
> {
  constructor(
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: GetRecentlyCompletedQuery): Promise<RecentlyCompletedDto> {
    const { actor, limit } = query;

    // 1. Fetch completed progress rows (adapter filters lessonsCompleted == lessonsTotal
    //    and orders by lastSeenAt DESC).
    const rows = await this.progressRepo.findCompletedByUser(actor.id, limit);

    if (rows.length === 0) {
      return { items: [] };
    }

    // 2. Bulk-fetch courses (one query — no N+1).
    const courseIds = rows.map((r) => r.courseId);
    const courses = await this.courseRepo.findByIds(courseIds);
    const courseMap = new Map<string, (typeof courses)[number]>(courses.map((c) => [c.id, c]));

    // 3. Authorization filter.
    const visible = await Promise.all(
      rows.map((row) => {
        const course = courseMap.get(row.courseId);
        if (!course) return Promise.resolve(false);
        return this.authz.canSee(actor, {
          kind: 'course',
          id: course.id,
          libraryId: course.libraryId as LibraryId,
        });
      }),
    );

    // 4. Map to RecentlyCompletedItem[].
    const items: RecentlyCompletedItem[] = rows
      .filter((_, i) => visible[i])
      .flatMap((row) => {
        const course = courseMap.get(row.courseId);
        if (!course) return [];

        const item: RecentlyCompletedItem = {
          courseId: row.courseId,
          courseTitle: course.title,
          lessonsTotal: row.lessonsTotal,
          // completedAt maps from lastSeenAt — equals completion time for fully-completed courses.
          completedAt: row.lastSeenAt.toISOString(),
          // librarySlug omitted: Library.name is not a URL slug.
        };

        return [item];
      });

    return { items };
  }
}

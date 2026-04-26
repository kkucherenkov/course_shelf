/**
 * WHY this file exists:
 * Query handler for GET /home/continue-watching. Reads exclusively from the
 * CourseProgressReadModel projection — never joins through lesson_progress at
 * request time (projection-fast, O(1) per user).
 *
 * Steps:
 *   1. Fetch all progress rows for the user, sorted by lastSeenAt DESC.
 *   2. Cap to the requested limit.
 *   3. Bulk-fetch courses + libraries in two queries (no N+1).
 *   4. Filter by AuthorizationService.canSee — defensive even though grants
 *      normally do not revoke after progress was recorded.
 *   5. Map to ContinueWatchingItem[].
 *
 * librarySlug note: the Library aggregate in this codebase uses `name` (not a
 * URL slug). The generated ContinueWatchingItem schema marks librarySlug as
 * optional (?) so it is omitted from the response rather than fabricated.
 * See TODO: add a `slug` field to Library in a future story.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';

import { GetContinueWatchingQuery } from './get-continue-watching.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { ContinueWatchingDto, ContinueWatchingItem } from '@app/api-client-ts';
import type { LibraryId } from '../../../../common/access/authorization.service';

@QueryHandler(GetContinueWatchingQuery)
export class GetContinueWatchingHandler implements IQueryHandler<
  GetContinueWatchingQuery,
  ContinueWatchingDto
> {
  constructor(
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: GetContinueWatchingQuery): Promise<ContinueWatchingDto> {
    const { actor, limit } = query;

    // 1. Fetch all progress rows, sorted by lastSeenAt DESC (adapter applies ordering).
    const allRows = await this.progressRepo.findManyByUser(actor.id);

    // 2. Cap to the requested limit before doing any I/O.
    const rows = allRows.slice(0, limit);

    if (rows.length === 0) {
      return { items: [] };
    }

    // 3. Bulk-fetch courses (one query, no N+1).
    // Libraries are fetched for grant evaluation (libraryId → canSee).
    // librarySlug is currently omitted from the response because Library has no
    // slug field yet — add it in a future story.
    const courseIds = rows.map((r) => r.courseId);
    const courses = await this.courseRepo.findByIds(courseIds);
    const courseMap = new Map<string, (typeof courses)[number]>(courses.map((c) => [c.id, c]));

    // 4. Authorization filter — defensive even though grants normally do not
    //    revoke after progress was recorded. Admins always pass.
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

    // 5. Map to ContinueWatchingItem[].
    const items: ContinueWatchingItem[] = rows
      .filter((_, i) => visible[i])
      .flatMap((row) => {
        const course = courseMap.get(row.courseId);
        if (!course) return [];

        // librarySlug is omitted: Library.name is not a URL slug. The generated
        // type marks librarySlug as optional so omitting it is spec-compliant.
        // Add a slug field to Library in a future story and wire it here.

        const item: ContinueWatchingItem = {
          courseId: row.courseId,
          courseTitle: course.title,
          percent: row.percent,
          lessonsCompleted: row.lessonsCompleted,
          lessonsTotal: row.lessonsTotal,
          lastSeenAt: row.lastSeenAt.toISOString(),
          lastSeenLessonId: row.lastSeenLessonId,
        };

        return [item];
      });

    return { items };
  }
}

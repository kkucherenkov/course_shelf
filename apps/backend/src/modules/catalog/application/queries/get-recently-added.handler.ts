/**
 * WHY this file exists:
 * Query handler for GET /home/recently-added. Reads directly from the Course
 * table (no completion filter — new users with zero progress should see the
 * library's recent intake) and enriches each item with lesson stats.
 *
 * Steps:
 *   1. Fetch top-(limit * 3) courses from the DB ordered by createdAt DESC.
 *   2. Authorization filter via AuthorizationService.canSee — defensive,
 *      consistent with the other home-row handlers.
 *   3. Slice to the requested limit.
 *   4. Bulk-fetch lesson stats (count + total duration) in one groupBy query,
 *      and per-user progress (lessonsCompleted) in one CourseProgressReadModel
 *      lookup by courseIds — no N+1. A course with no progress row gets
 *      lessonsCompleted: 0, an honest zero rather than a hardcoded one, so it
 *      matches whatever "Continue watching" shows for the same course.
 *   5. Map to RecentlyAddedItem[].
 *
 * The 3× DB fetch overhead is documented in CourseRepository.findRecentlyAdded.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';

import { GetRecentlyAddedQuery } from './get-recently-added.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LibraryId } from '../../../../common/access/authorization.service';
import type { RecentlyAddedDto, RecentlyAddedItem } from '@app/api-client-ts';

@QueryHandler(GetRecentlyAddedQuery)
export class GetRecentlyAddedHandler implements IQueryHandler<
  GetRecentlyAddedQuery,
  RecentlyAddedDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: GetRecentlyAddedQuery): Promise<RecentlyAddedDto> {
    const { actor, limit } = query;

    // 1. Fetch courses ordered by createdAt DESC (adapter fetches limit * 3).
    const candidates = await this.courseRepo.findRecentlyAdded(limit);

    if (candidates.length === 0) {
      return { items: [] };
    }

    // 2. Authorization filter.
    const visible = await Promise.all(
      candidates.map((course) =>
        this.authz.canSee(actor, {
          kind: 'course',
          id: course.id,
          libraryId: course.libraryId as LibraryId,
        }),
      ),
    );

    // 3. Slice to requested limit after filtering.
    const accessible = candidates.filter((_, i) => visible[i]).slice(0, limit);

    if (accessible.length === 0) {
      return { items: [] };
    }

    // 4. Bulk-fetch lesson stats (one groupBy query) and per-user progress
    // (one CourseProgressReadModel lookup by courseIds) — no N+1.
    const courseIds = accessible.map((c) => c.id);
    const [statsMap, progressRows] = await Promise.all([
      this.lessonRepo.getLessonStatsByCourseIds(courseIds),
      this.progressRepo.findManyByCourseIdsForUser(actor.id, courseIds),
    ]);
    const completedByCourseId = new Map(progressRows.map((p) => [p.courseId, p.lessonsCompleted]));

    // 5. Map to RecentlyAddedItem[].
    const items: RecentlyAddedItem[] = accessible.map((course) => {
      const stats = statsMap.get(course.id) ?? { lessonCount: 0, totalDurationSeconds: 0 };
      return {
        courseId: course.id,
        courseTitle: course.title,
        lessonCount: stats.lessonCount,
        lessonsCompleted: completedByCourseId.get(course.id) ?? 0,
        totalDurationSeconds: stats.totalDurationSeconds,
        createdAt: course.createdAt.toISOString(),
        // librarySlug omitted: Library.name is not a URL slug. See continue-watching handler.
      };
    });

    return { items };
  }
}

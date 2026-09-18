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
 *   4. Batch-verify lastSeenLessonId still exists (#497) — a scoped rescan
 *      can delete a lesson without touching this projection field, unlike
 *      lessonsTotal/percent, which self-heal on the next progress event. One
 *      findMany, not one exists() per row.
 *   4b. Bulk-fetch LessonProgress rows for the same lastSeenLessonId set (one
 *      findManyByUserAndLessons call, same join get-course-outline.handler
 *      already uses) to source resumePositionSeconds. The
 *      CourseProgressReadModel projection tracks lastSeenLessonId but not a
 *      position, so this is a join by (userId, lastSeenLessonId), not a new
 *      column.
 *   5. Filter by AuthorizationService.canSee — defensive even though grants
 *      normally do not revoke after progress was recorded.
 *   6. Map to ContinueWatchingItem[], dropping rows whose last-seen lesson no
 *      longer exists — lastSeenLessonId is required on the wire, so a stale
 *      id cannot be sent as-is, and no lesson in the course is a better
 *      substitute than the one the user actually last watched.
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
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';

import { GetContinueWatchingQuery } from './get-continue-watching.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
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
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY)
    private readonly lessonProgressRepo: LessonProgressRepository,
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

    // 4. Batch-verify lastSeenLessonId still exists (#497). 4b. Bulk-fetch
    // LessonProgress rows for the same lesson set to source
    // resumePositionSeconds — one findMany, not one lookup per row.
    const lastSeenLessonIds = [...new Set(rows.map((r) => r.lastSeenLessonId))];
    const [existingLessonIds, positionRows] = await Promise.all([
      this.lessonRepo.existsByIds(lastSeenLessonIds),
      this.lessonProgressRepo.findManyByUserAndLessons(actor.id, lastSeenLessonIds),
    ]);
    const positionByLessonId = new Map(positionRows.map((p) => [p.lessonId, p.positionSeconds]));

    // 5. Authorization filter — defensive even though grants normally do not
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

    // 6. Map to ContinueWatchingItem[].
    const items: ContinueWatchingItem[] = rows
      .filter((row, i) => visible[i] && existingLessonIds.has(row.lastSeenLessonId))
      .flatMap((row) => {
        const course = courseMap.get(row.courseId);
        if (!course) return [];

        // librarySlug is omitted: Library.name is not a URL slug. The generated
        // type marks librarySlug as optional so omitting it is spec-compliant.
        // Add a slug field to Library in a future story and wire it here.

        const resumePositionSeconds = positionByLessonId.get(row.lastSeenLessonId);

        const item: ContinueWatchingItem = {
          courseId: row.courseId,
          courseTitle: course.title,
          percent: row.percent,
          lessonsCompleted: row.lessonsCompleted,
          lessonsTotal: row.lessonsTotal,
          lastSeenAt: row.lastSeenAt.toISOString(),
          lastSeenLessonId: row.lastSeenLessonId,
          ...(resumePositionSeconds === undefined ? {} : { resumePositionSeconds }),
        };

        return [item];
      });

    return { items };
  }
}

/**
 * WHY this file exists:
 * Command handler for POST /courses/{id}/mark-complete.
 *
 * Bulk-marks every lesson in the course as completed for the requester, then
 * refreshes the CourseProgressReadModel projection, and finally re-runs the
 * GetCourseOutlineQuery so the controller receives the updated DTO in one hop.
 *
 * Projection sync choice — direct upsert, not event fan-out:
 *   Dispatching one LessonCompleted event per lesson would trigger N handler
 *   invocations each doing a lessons.findByCourse + countCompleted roundtrip
 *   (O(N²) DB calls). For a course with 50 lessons that is 100 extra queries
 *   vs. 2 here. We inline the read-model update (count from lessonIds.length
 *   which we already have) instead. This is documented here as the deliberate
 *   deviation from the event-driven path.
 *
 * Auth: existence → 404, then canSee → 403 (same order as GetCourseHandler).
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { nanoid } from 'nanoid';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { GetCourseOutlineQuery } from '../queries/get-course-outline.query';

import { MarkCourseCompleteCommand } from './mark-course-complete.command';

import type {
  AuthorizationService,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseOutlineDto } from '@app/api-client-ts';

@CommandHandler(MarkCourseCompleteCommand)
export class MarkCourseCompleteHandler implements ICommandHandler<
  MarkCourseCompleteCommand,
  CourseOutlineDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly readModelRepo: CourseProgressReadModelRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY)
    private readonly lessonProgressRepo: LessonProgressRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: MarkCourseCompleteCommand): Promise<CourseOutlineDto> {
    const { courseId, actor } = command;
    const now = new Date();

    // 1. Existence → 404.
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    // 2. Authz → 403.
    const allowed = await this.authz.canSee(actor, {
      kind: 'library',
      id: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this course.');
    }

    // 3. Fetch all lessons for the course.
    const lessons = await this.lessonRepo.findByCourse(courseId);

    if (lessons.length === 0) {
      // Nothing to mark — return the outline directly (idempotent).
      return this.queryBus.execute<GetCourseOutlineQuery, CourseOutlineDto>(
        new GetCourseOutlineQuery(courseId, actor),
      );
    }

    // 4. Bulk-upsert completed progress rows (single transaction).
    await this.lessonProgressRepo.bulkUpsertCompleted(
      actor.id,
      lessons.map((l) => ({ id: String(l.id), durationSeconds: l.duration })),
      now,
    );

    // 5. Refresh the CourseProgressReadModel projection directly.
    //    We know all lessons are now complete, so percent = 100.
    //    lastSeenLessonId = last lesson by position (already sorted by findByCourse).
    //    .at(-1) is safe here — lessons.length > 0 is checked at line 81.
    const lastLesson = lessons.at(-1);
    const existing = await this.readModelRepo.findByUserAndCourse(actor.id, courseId);

    const model = CourseProgressReadModel.create({
      id: existing?.id ?? nanoid(),
      userId: actor.id,
      courseId,
      lessonsCompleted: lessons.length,
      lessonsTotal: lessons.length,
      percent: 100,
      lastSeenAt: now,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- lessons.length > 0 checked above
      lastSeenLessonId: String(lastLesson!.id),
    });
    await this.readModelRepo.upsert(model);

    // 6. Return the refreshed outline.
    return this.queryBus.execute<GetCourseOutlineQuery, CourseOutlineDto>(
      new GetCourseOutlineQuery(courseId, actor),
    );
  }
}

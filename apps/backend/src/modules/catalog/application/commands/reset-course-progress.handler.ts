/**
 * WHY this file exists:
 * Command handler for POST /courses/{id}/reset-progress.
 *
 * Clears all LessonProgress rows for (requester, course), then removes the
 * CourseProgressReadModel projection row so the outline returns zero progress
 * without an intermediate stale state.
 *
 * Projection sync choice — deleteByUserAndCourse on the read model:
 *   After deleting LessonProgress rows the projection would be stale (still
 *   shows completed = N). The simplest correct path is to delete the
 *   projection row too. The next outline load will then return zero progress
 *   from the PROGRESS_PLACEHOLDER fallback — no rebuild needed. This is
 *   cheaper than a full projection rebuild and correct because the absence of
 *   a row ≡ zero progress.
 *
 * Auth: existence → 404, then canSee → 403.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';
import { GetCourseOutlineQuery } from '../queries/get-course-outline.query';

import { ResetCourseProgressCommand } from './reset-course-progress.command';

import type {
  AuthorizationService,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseOutlineDto } from '@app/api-client-ts';

@CommandHandler(ResetCourseProgressCommand)
export class ResetCourseProgressHandler implements ICommandHandler<
  ResetCourseProgressCommand,
  CourseOutlineDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly readModelRepo: CourseProgressReadModelRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY)
    private readonly lessonProgressRepo: LessonProgressRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: ResetCourseProgressCommand): Promise<CourseOutlineDto> {
    const { courseId, actor } = command;

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

    // 3. Delete all LessonProgress rows for (actor, course) — idempotent.
    await this.lessonProgressRepo.deleteAllByUserAndCourse(actor.id, courseId);

    // 4. Delete the CourseProgressReadModel projection row — absence = zero progress.
    await this.readModelRepo.deleteByUserAndCourse(actor.id, courseId);

    // 5. Return the refreshed outline.
    return this.queryBus.execute<GetCourseOutlineQuery, CourseOutlineDto>(
      new GetCourseOutlineQuery(courseId, actor),
    );
  }
}

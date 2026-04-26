/**
 * WHY this file exists:
 * Orchestrates the "get lesson progress" use case.
 *
 * Steps:
 *   1. Load lesson. If missing → PermissionDenied, NOT LessonNotFoundError.
 *      WHY: "no-oracle" rule — a 404 on a missing lesson would let an
 *      unauthenticated / unauthorised caller enumerate lesson ids. We return 403
 *      so the lesson's existence is not disclosed to actors without access.
 *   2. AuthorizationService.canSee → PermissionDenied if non-admin without grant.
 *   3. Load progress. If absent → LessonProgressNotFoundError (404).
 *   4. Return LessonProgressDto.
 *
 * No NestJS HTTP exceptions. HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY, LESSON_REPOSITORY } from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonProgressNotFoundError } from '../../domain/progress/lesson-progress.errors';
import { LESSON_PROGRESS_REPOSITORY } from '../../domain/progress/lesson-progress.repository';

import { GetLessonProgressQuery } from './get-lesson-progress.query';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { LessonProgressRepository } from '../../domain/progress/lesson-progress.repository';
import type { LessonProgress } from '../../domain/progress/lesson-progress';
import type { LessonProgressDto } from '@app/api-client-ts';

function toDto(p: LessonProgress): LessonProgressDto {
  return {
    lessonId: p.lessonId,
    positionSeconds: p.positionSeconds,
    durationSeconds: p.durationSeconds,
    percent: p.percent,
    completed: p.completed,
    lastSeenAt: p.lastSeenAt.toISOString(),
    // exactOptionalPropertyTypes: omit the key entirely when undefined.
    ...(p.completedAt === undefined ? {} : { completedAt: p.completedAt.toISOString() }),
  };
}

@QueryHandler(GetLessonProgressQuery)
export class GetLessonProgressHandler implements IQueryHandler<
  GetLessonProgressQuery,
  LessonProgressDto
> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(LESSON_PROGRESS_REPOSITORY) private readonly progressRepo: LessonProgressRepository,
  ) {}

  async execute(query: GetLessonProgressQuery): Promise<LessonProgressDto> {
    const { lessonId, actor } = query;

    // No-oracle rule: missing lesson is presented as 403, not 404, so callers
    // cannot enumerate lesson ids by observing the error status code.
    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const allowed = await this.authz.canSee(actor, {
      kind: 'lesson',
      id: lessonId as never,
      courseId: lesson.courseId as CourseId,
      libraryId: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    const progress = await this.progressRepo.findByUserAndLesson(actor.id, lessonId);
    if (!progress) {
      throw new LessonProgressNotFoundError(lessonId);
    }

    return toDto(progress);
  }
}

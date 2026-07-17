/**
 * WHY this file exists:
 * Query handler for GET /courses/{id}/download-estimate.
 *
 * Feeds the mobile course-detail "Download course · <size>" CTA. Reports only
 * the aggregate byte total across the course's lessons plus the lesson count
 * — per-lesson download state is decided client-side.
 *
 * Authz: existence is checked first (→ 404), then the grant is evaluated (→ 403)
 * — same order as GetCourseOutlineHandler to avoid leaking course existence.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';

import { GetCourseDownloadEstimateQuery } from './get-course-download-estimate.query';

import type {
  AuthorizationService,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseDownloadEstimateDto } from '@app/api-client-ts';

@QueryHandler(GetCourseDownloadEstimateQuery)
export class GetCourseDownloadEstimateHandler implements IQueryHandler<
  GetCourseDownloadEstimateQuery,
  CourseDownloadEstimateDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: GetCourseDownloadEstimateQuery): Promise<CourseDownloadEstimateDto> {
    const { courseId, actor } = query;

    // 1. Existence check → 404.
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    // 2. Authz check → 403.
    const allowed = await this.authz.canSee(actor, {
      kind: 'library',
      id: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this course.');
    }

    // 3. Sum sizeBytes across all lessons in the course (one query).
    const lessons = await this.lessonRepo.findByCourse(courseId);
    const totalBytes = lessons.reduce((sum, l) => sum + l.sizeBytes, 0);
    const lessonCount = lessons.length;

    return { courseId: String(course.id), totalBytes, lessonCount };
  }
}

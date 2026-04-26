/**
 * WHY this file exists:
 * Query handler for GET /courses/{id}. Enforces visibility in the same pattern
 * as GetLibraryHandler: existence is checked first (→ 404), then the grant is
 * evaluated (→ 403). This prevents attackers from distinguishing "does not exist"
 * from "you cannot see it" via a timing or status-code oracle.
 *
 * Progress: as of E10-F01-S01, the progress field is populated from the
 * CourseProgressReadModel projection (single keyed lookup). When no row exists
 * yet, the zero placeholder is returned — DTO shape is unchanged.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { toCourseDto } from '../../courses.dto';

import { GetCourseQuery } from './get-course.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { CourseDto } from '@app/api-client-ts';
import type { LibraryId } from '../../../../common/access/authorization.service';

@QueryHandler(GetCourseQuery)
export class GetCourseHandler implements IQueryHandler<GetCourseQuery, CourseDto> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
  ) {}

  async execute(query: GetCourseQuery): Promise<CourseDto> {
    const course = await this.repo.findById(query.id);

    if (!course) {
      throw new CourseNotFoundError(query.id);
    }

    const allowed = await this.authz.canSee(query.actor, {
      kind: 'library',
      id: course.libraryId as LibraryId,
    });

    if (!allowed) {
      throw new PermissionDenied('You do not have access to this course.');
    }

    const progressRow = await this.progressRepo.findByUserAndCourse(query.actor.id, course.id);

    return toCourseDto(course, progressRow);
  }
}

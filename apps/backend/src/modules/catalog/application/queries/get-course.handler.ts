/**
 * WHY this file exists:
 * Query handler for GET /courses/{id}. Enforces visibility in the same pattern
 * as GetLibraryHandler: existence is checked first (→ 404), then the grant is
 * evaluated (→ 403). This prevents attackers from distinguishing "does not exist"
 * from "you cannot see it" via a timing or status-code oracle.
 *
 * Progress is a v1 placeholder — E10-F01-S01 will populate it.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { toCourseDto } from '../../courses.dto';

import { GetCourseQuery } from './get-course.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseDto } from '@app/api-client-ts';
import type { LibraryId } from '../../../../common/access/authorization.service';

@QueryHandler(GetCourseQuery)
export class GetCourseHandler implements IQueryHandler<GetCourseQuery, CourseDto> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
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

    return toCourseDto(course);
  }
}

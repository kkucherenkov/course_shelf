/**
 * WHY this file exists:
 * Query handler for listing courses. Visibility is enforced via
 * AuthorizationService.canSee (same pattern as ListLibrariesHandler):
 *   - Admins receive all courses (service short-circuits to true).
 *   - Non-admins receive only courses inside libraries they have a READ grant on.
 *
 * canSee calls are batched via Promise.all so they hit the in-process LRU
 * cache concurrently after the first call per user.
 *
 * Progress is a v1 placeholder (zeros) — E10-F01-S01 will populate it.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { toCourseDto } from '../../courses.dto';

import { ListCoursesQuery } from './list-courses.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseDto } from '@app/api-client-ts';
import type { LibraryId } from '../../../../common/access/authorization.service';

@QueryHandler(ListCoursesQuery)
export class ListCoursesHandler implements IQueryHandler<ListCoursesQuery, CourseDto[]> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: ListCoursesQuery): Promise<CourseDto[]> {
    const courses = query.libraryId
      ? await this.repo.findManyByLibrary(query.libraryId)
      : await this.repo.findAll();

    const visible = await Promise.all(
      courses.map((c) =>
        this.authz.canSee(query.actor, {
          kind: 'library',
          id: c.libraryId as LibraryId,
        }),
      ),
    );

    return courses.filter((_, i) => visible[i]).map((c) => toCourseDto(c));
  }
}

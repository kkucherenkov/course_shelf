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
 * Progress: as of E10-F01-S01, progress fields are populated from the
 * CourseProgressReadModel projection via a single bulk lookup
 * (findManyByCourseIdsForUser). This avoids N+1 against lesson_progress.
 * When no projection row exists, the zero placeholder is returned unchanged.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { toCourseDto } from '../../courses.dto';

import { ListCoursesQuery } from './list-courses.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { CourseDto } from '@app/api-client-ts';
import type { LibraryId } from '../../../../common/access/authorization.service';

@QueryHandler(ListCoursesQuery)
export class ListCoursesHandler implements IQueryHandler<ListCoursesQuery, CourseDto[]> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
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

    const visibleCourses = courses.filter((_, i) => visible[i]);

    // Single bulk lookup — one query for all courses, no N+1.
    const progressRows = await this.progressRepo.findManyByCourseIdsForUser(
      query.actor.id,
      visibleCourses.map((c) => c.id),
    );
    const progressMap = new Map(progressRows.map((p) => [p.courseId, p]));

    const dtos = visibleCourses.map((c) => toCourseDto(c, progressMap.get(c.id)));

    // Status filter — operates on the projected percent so a course with
    // no progress row falls into 'not-started' (toCourseDto returns the
    // zero placeholder when progressMap.get is undefined).
    const filtered =
      query.status === 'all'
        ? dtos
        : dtos.filter((d) => {
            const p = d.progress.percent;
            switch (query.status) {
              case 'completed': {
                return p === 100;
              }
              case 'in-progress': {
                return p > 0 && p < 100;
              }
              case 'not-started': {
                return p === 0;
              }
              default: {
                return true;
              }
            }
          });

    // Server-side sort. `recently-watched` uses updatedAt as a proxy for
    // last activity until a dedicated lastViewedAt lands.
    const sorted = [...filtered].toSorted((a, b) => {
      switch (query.sort) {
        case 'newest': {
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        }
        case 'alphabetical': {
          return a.title.localeCompare(b.title);
        }
        default: {
          // 'recently-watched' (default).
          return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
        }
      }
    });

    return sorted;
  }
}

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
 *
 * Duration: as of E31-F01-S01 the handler also serves `durationBucket` and
 * `sort=duration`. Total runtime is not on CourseDto, so it comes from one
 * bulk `getLessonStatsByCourseIds` groupBy — fetched only when a duration
 * filter or sort is actually requested, so the common Browse request keeps
 * the same query count it had before.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { toCourseDto } from '../../courses.dto';

import { ListCoursesQuery } from './list-courses.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { CourseDto } from '@app/api-client-ts';
import type { LibraryId } from '../../../../common/access/authorization.service';
import type { CourseListDurationBucket } from './list-courses.query';

const HOUR_SECONDS = 3600;

/** Inclusive lower bound and exclusive upper bound, in seconds. */
const DURATION_BUCKETS: Record<
  Exclude<CourseListDurationBucket, 'all'>,
  { min: number; max: number }
> = {
  lt5: { min: 0, max: 5 * HOUR_SECONDS },
  '5to10': { min: 5 * HOUR_SECONDS, max: 10 * HOUR_SECONDS },
  '10to20': { min: 10 * HOUR_SECONDS, max: 20 * HOUR_SECONDS },
  gt20: { min: 20 * HOUR_SECONDS, max: Number.POSITIVE_INFINITY },
};

@QueryHandler(ListCoursesQuery)
export class ListCoursesHandler implements IQueryHandler<ListCoursesQuery, CourseDto[]> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly repo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
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
    let filtered =
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

    // Instructor filter — cheap, applied before the duration lookup so the
    // groupBy below runs over the smallest possible id set.
    const { instructorId } = query;
    if (instructorId !== undefined && instructorId !== '') {
      filtered = filtered.filter((d) => (d.instructors ?? []).some((i) => i.id === instructorId));
    }

    // Duration is not part of CourseDto, so it needs its own lookup. Skip it
    // entirely unless a duration filter or the duration sort was requested.
    const needsDuration = query.durationBucket !== 'all' || query.sort === 'duration';
    let durationByCourseId = new Map<string, number>();
    if (needsDuration && filtered.length > 0) {
      const stats = await this.lessonRepo.getLessonStatsByCourseIds(filtered.map((d) => d.id));
      durationByCourseId = new Map(
        [...stats].map(([courseId, s]) => [courseId, s.totalDurationSeconds]),
      );
    }
    // Courses with no lessons are absent from the groupBy result — 0 seconds.
    const durationOf = (id: string): number => durationByCourseId.get(id) ?? 0;

    if (query.durationBucket !== 'all') {
      const { min, max } = DURATION_BUCKETS[query.durationBucket];
      filtered = filtered.filter((d) => {
        const seconds = durationOf(d.id);
        return seconds >= min && seconds < max;
      });
    }

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
        case 'duration': {
          // Longest first — the useful end of the scale when you are picking
          // what to commit to. Ties fall back to title so the order is stable.
          return durationOf(b.id) - durationOf(a.id) || a.title.localeCompare(b.title);
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

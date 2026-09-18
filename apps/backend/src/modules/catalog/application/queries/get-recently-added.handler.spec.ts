/**
 * Unit tests for GetRecentlyAddedHandler.
 *
 * Scenarios:
 *   - Empty: no courses → empty items.
 *   - Happy path: returns items enriched with lesson stats.
 *   - Authz filter: canSee=false drops a course.
 *   - Caps to requested limit after authz filtering.
 */
import { describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { GetRecentlyAddedQuery } from './get-recently-added.query';
import { GetRecentlyAddedHandler } from './get-recently-added.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');

const ADMIN = { id: 'admin-1', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

function makeCourse(id: string, createdAt: Date = NOW, libraryId = 'lib-1'): Course {
  return Course.reconstitute({
    id: id as ReturnType<typeof Course.reconstitute>['id'],
    libraryId,
    slug: `course-${id}`,
    title: `Course ${id}`,
    description: undefined,
    createdAt,
    updatedAt: createdAt,
    sections: [],
  });
}

function makeCourseRepo(courses: Course[]): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findRecentlyAdded: vi.fn().mockResolvedValue(courses),
  };
}

function makeLessonRepo(
  statsMap = new Map<string, { lessonCount: number; totalDurationSeconds: number }>(),
): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    parkPositionsForResync: vi.fn(),
    removeMany: vi.fn(),
    getLessonStatsByCourseIds: vi.fn().mockResolvedValue(statsMap),
    existsByIds: vi.fn().mockResolvedValue(new Set()),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

/** Defaults to "no progress rows" — tests that care about lessonsCompleted override this. */
function makeProgressRepo(rows: CourseProgressReadModel[] = []): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn(),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn().mockResolvedValue(rows),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
    deleteByUserAndCourse: vi.fn(),
  };
}

function makeHandler(opts: {
  courses?: Course[];
  statsMap?: Map<string, { lessonCount: number; totalDurationSeconds: number }>;
  progressRows?: CourseProgressReadModel[];
  allow?: boolean;
}) {
  const courses = opts.courses ?? [];
  const courseRepo = makeCourseRepo(courses);
  const lessonRepo = makeLessonRepo(opts.statsMap);
  const progressRepo = makeProgressRepo(opts.progressRows);
  const authz = makeAuthz(opts.allow ?? true);
  return {
    handler: new GetRecentlyAddedHandler(courseRepo, lessonRepo, progressRepo, authz),
    courseRepo,
    lessonRepo,
    progressRepo,
    authz,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetRecentlyAddedHandler', () => {
  describe('empty result', () => {
    it('returns empty items when no courses exist', async () => {
      const { handler } = makeHandler({ courses: [] });
      const result = await handler.execute(new GetRecentlyAddedQuery(USER, 10));

      expect(result.items).toEqual([]);
    });
  });

  describe('happy path', () => {
    it('returns items enriched with lesson stats', async () => {
      const course = makeCourse('course-1', NOW);
      const statsMap = new Map([['course-1', { lessonCount: 5, totalDurationSeconds: 3600 }]]);
      const { handler } = makeHandler({ courses: [course], statsMap, allow: true });
      const result = await handler.execute(new GetRecentlyAddedQuery(ADMIN, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        courseId: 'course-1',
        courseTitle: 'Course course-1',
        lessonCount: 5,
        totalDurationSeconds: 3600,
        createdAt: NOW.toISOString(),
      });
    });

    it('defaults lessonCount and totalDurationSeconds to 0 when course has no lessons', async () => {
      const course = makeCourse('course-1', NOW);
      const { handler } = makeHandler({ courses: [course], statsMap: new Map(), allow: true });
      const result = await handler.execute(new GetRecentlyAddedQuery(ADMIN, 10));

      expect(result.items[0]).toMatchObject({ lessonCount: 0, totalDurationSeconds: 0 });
    });
  });

  describe('lessonsCompleted (tuxedo 182)', () => {
    it('fills lessonsCompleted from the bulk CourseProgressReadModel lookup', async () => {
      const course = makeCourse('course-1', NOW);
      const progressRows = [
        CourseProgressReadModel.create({
          id: 'cprm-course-1',
          userId: ADMIN.id,
          courseId: 'course-1',
          lessonsCompleted: 3,
          lessonsTotal: 10,
          percent: 30,
          lastSeenAt: NOW,
          lastSeenLessonId: 'lesson-1',
        }),
      ];
      const { handler } = makeHandler({ courses: [course], progressRows, allow: true });
      const result = await handler.execute(new GetRecentlyAddedQuery(ADMIN, 10));

      expect(result.items[0]?.lessonsCompleted).toBe(3);
    });

    it('defaults lessonsCompleted to 0 for a course with no progress row', async () => {
      const course = makeCourse('course-1', NOW);
      const { handler } = makeHandler({ courses: [course], progressRows: [], allow: true });
      const result = await handler.execute(new GetRecentlyAddedQuery(ADMIN, 10));

      expect(result.items[0]?.lessonsCompleted).toBe(0);
    });
  });

  describe('authz filter', () => {
    it('drops courses where canSee returns false', async () => {
      const courses = [makeCourse('course-1', NOW), makeCourse('course-2', EARLIER)];
      const courseRepo = makeCourseRepo(courses);
      const lessonRepo = makeLessonRepo();
      const authz: AuthorizationService = {
        canSee: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        invalidate: vi.fn(),
        listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
      };
      const progressRepo = makeProgressRepo();
      const handler = new GetRecentlyAddedHandler(courseRepo, lessonRepo, progressRepo, authz);
      const result = await handler.execute(new GetRecentlyAddedQuery(USER, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.courseId).toBe('course-1');
    });

    it('returns empty items when all courses are inaccessible', async () => {
      const courses = [makeCourse('course-1', NOW)];
      const { handler } = makeHandler({ courses, allow: false });
      const result = await handler.execute(new GetRecentlyAddedQuery(USER, 10));

      expect(result.items).toEqual([]);
    });
  });

  describe('limit enforcement', () => {
    it('caps to the requested limit after authz filtering', async () => {
      const courses = [
        makeCourse('course-1', NOW),
        makeCourse('course-2', EARLIER),
        makeCourse('course-3', EARLIER),
      ];
      const { handler } = makeHandler({ courses, allow: true });
      const result = await handler.execute(new GetRecentlyAddedQuery(ADMIN, 2));

      expect(result.items).toHaveLength(2);
    });
  });
});

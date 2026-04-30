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
import { GetRecentlyAddedQuery } from './get-recently-added.query';
import { GetRecentlyAddedHandler } from './get-recently-added.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
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
    getLessonStatsByCourseIds: vi.fn().mockResolvedValue(statsMap),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeHandler(opts: {
  courses?: Course[];
  statsMap?: Map<string, { lessonCount: number; totalDurationSeconds: number }>;
  allow?: boolean;
}) {
  const courses = opts.courses ?? [];
  const courseRepo = makeCourseRepo(courses);
  const lessonRepo = makeLessonRepo(opts.statsMap);
  const authz = makeAuthz(opts.allow ?? true);
  return {
    handler: new GetRecentlyAddedHandler(courseRepo, lessonRepo, authz),
    courseRepo,
    lessonRepo,
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
      const handler = new GetRecentlyAddedHandler(courseRepo, lessonRepo, authz);
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

/**
 * Unit tests for GetContinueWatchingHandler.
 *
 * Scenarios:
 *   - Empty for new user (no progress rows).
 *   - Returns top-N sorted by lastSeenAt DESC.
 *   - Non-admin filter: canSee=false drops items.
 *   - Admin bypass: canSee=true for all.
 */
import { describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { GetContinueWatchingQuery } from './get-continue-watching.query';
import { GetContinueWatchingHandler } from './get-continue-watching.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');
const EARLIEST = new Date('2026-04-24T10:00:00.000Z');

const ADMIN = { id: 'admin-1', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

function makeProgressRow(courseId: string, lastSeenAt: Date): CourseProgressReadModel {
  return CourseProgressReadModel.create({
    id: `cprm-${courseId}`,
    userId: USER.id,
    courseId,
    lessonsCompleted: 2,
    lessonsTotal: 5,
    percent: 40,
    lastSeenAt,
    lastSeenLessonId: 'lesson-1',
  });
}

function makeCourse(id: string, libraryId = 'lib-1'): Course {
  return Course.create({
    id,
    libraryId,
    slug: `course-${id}`,
    title: `Course ${id}`,
    now: NOW,
  });
}

function makeProgressRepo(rows: CourseProgressReadModel[]): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn(),
    findManyByUser: vi.fn().mockResolvedValue(rows),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
    deleteByUserAndCourse: vi.fn(),
  };
}

function makeCourseRepo(courses: Course[]): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn().mockResolvedValue(courses),
    findRecentlyAdded: vi.fn(),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

/** Defaults to "every id exists" — tests that care about #497 override this. */
function makeLessonRepo(existingIds?: string[]): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    parkPositionsForResync: vi.fn(),
    removeMany: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
    existsByIds: vi
      .fn()
      .mockImplementation((ids: readonly string[]) => Promise.resolve(new Set(existingIds ?? ids))),
  };
}

function makeHandler(opts: {
  rows?: CourseProgressReadModel[];
  courses?: Course[];
  allow?: boolean;
  existingLessonIds?: string[];
}) {
  const rows = opts.rows ?? [];
  const courses = opts.courses ?? [];
  const progressRepo = makeProgressRepo(rows);
  const courseRepo = makeCourseRepo(courses);
  const lessonRepo = makeLessonRepo(opts.existingLessonIds);
  const authz = makeAuthz(opts.allow ?? true);
  const handler = new GetContinueWatchingHandler(progressRepo, courseRepo, lessonRepo, authz);
  return { handler, progressRepo, courseRepo, lessonRepo, authz };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetContinueWatchingHandler', () => {
  describe('empty for new user', () => {
    it('returns empty items when user has no progress rows', async () => {
      const { handler } = makeHandler({ rows: [] });
      const result = await handler.execute(new GetContinueWatchingQuery(USER, 10));

      expect(result.items).toEqual([]);
    });
  });

  describe('sorted top-N', () => {
    it('returns items in lastSeenAt DESC order (as provided by adapter)', async () => {
      const rows = [
        makeProgressRow('course-1', NOW),
        makeProgressRow('course-2', EARLIER),
        makeProgressRow('course-3', EARLIEST),
      ];
      const courses = [makeCourse('course-1'), makeCourse('course-2'), makeCourse('course-3')];
      const { handler } = makeHandler({ rows, courses, allow: true });
      const result = await handler.execute(new GetContinueWatchingQuery(ADMIN, 10));

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.courseId).toBe('course-1');
      expect(result.items[1]?.courseId).toBe('course-2');
      expect(result.items[2]?.courseId).toBe('course-3');
    });

    it('caps to limit', async () => {
      const rows = [
        makeProgressRow('course-1', NOW),
        makeProgressRow('course-2', EARLIER),
        makeProgressRow('course-3', EARLIEST),
      ];
      const courses = [makeCourse('course-1'), makeCourse('course-2'), makeCourse('course-3')];
      const { handler } = makeHandler({ rows, courses, allow: true });
      const result = await handler.execute(new GetContinueWatchingQuery(ADMIN, 2));

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.courseId).toBe('course-1');
    });
  });

  describe('non-admin grant filter', () => {
    it('drops courses where canSee returns false', async () => {
      const rows = [makeProgressRow('course-1', NOW), makeProgressRow('course-2', EARLIER)];
      const courses = [makeCourse('course-1'), makeCourse('course-2')];
      const progressRepo = makeProgressRepo(rows);
      const courseRepo = makeCourseRepo(courses);

      // canSee: true for course-1, false for course-2
      const authz: AuthorizationService = {
        canSee: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        invalidate: vi.fn(),
        listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
      };
      const lessonRepo = makeLessonRepo();
      const handler = new GetContinueWatchingHandler(progressRepo, courseRepo, lessonRepo, authz);
      const result = await handler.execute(new GetContinueWatchingQuery(USER, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.courseId).toBe('course-1');
    });
  });

  describe('lastSeenLessonId resolution (#497)', () => {
    it('omits an item whose lastSeenLessonId no longer exists', async () => {
      const rows = [
        CourseProgressReadModel.create({
          id: 'cprm-course-1',
          userId: USER.id,
          courseId: 'course-1',
          lessonsCompleted: 2,
          lessonsTotal: 5,
          percent: 40,
          lastSeenAt: NOW,
          lastSeenLessonId: 'lesson-deleted',
        }),
        makeProgressRow('course-2', EARLIER), // lastSeenLessonId: 'lesson-1', kept
      ];
      const courses = [makeCourse('course-1'), makeCourse('course-2')];
      // Only 'lesson-1' still exists — 'lesson-deleted' does not.
      const { handler } = makeHandler({
        rows,
        courses,
        allow: true,
        existingLessonIds: ['lesson-1'],
      });

      const result = await handler.execute(new GetContinueWatchingQuery(ADMIN, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.courseId).toBe('course-2');
    });

    it('keeps an item whose lastSeenLessonId still exists', async () => {
      const rows = [makeProgressRow('course-1', NOW)];
      const courses = [makeCourse('course-1')];
      const { handler } = makeHandler({
        rows,
        courses,
        allow: true,
        existingLessonIds: ['lesson-1'],
      });

      const result = await handler.execute(new GetContinueWatchingQuery(ADMIN, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.lastSeenLessonId).toBe('lesson-1');
    });
  });

  describe('admin bypass', () => {
    it('admin sees all items', async () => {
      const rows = [makeProgressRow('course-1', NOW), makeProgressRow('course-2', EARLIER)];
      const courses = [makeCourse('course-1'), makeCourse('course-2')];
      const { handler } = makeHandler({ rows, courses, allow: true });
      const result = await handler.execute(new GetContinueWatchingQuery(ADMIN, 10));

      expect(result.items).toHaveLength(2);
    });
  });

  describe('DTO shape', () => {
    it('item has required fields', async () => {
      const row = makeProgressRow('course-1', NOW);
      const course = makeCourse('course-1');
      const { handler } = makeHandler({ rows: [row], courses: [course], allow: true });
      const result = await handler.execute(new GetContinueWatchingQuery(ADMIN, 10));

      expect(result.items[0]).toMatchObject({
        courseId: 'course-1',
        courseTitle: 'Course course-1',
        percent: 40,
        lessonsCompleted: 2,
        lessonsTotal: 5,
        lastSeenLessonId: 'lesson-1',
      });
      expect(result.items[0]?.lastSeenAt).toBe(NOW.toISOString());
    });
  });
});

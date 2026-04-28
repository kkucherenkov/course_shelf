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
  };
}

function makeHandler(opts: {
  rows?: CourseProgressReadModel[];
  courses?: Course[];
  allow?: boolean;
}) {
  const rows = opts.rows ?? [];
  const courses = opts.courses ?? [];
  const progressRepo = makeProgressRepo(rows);
  const courseRepo = makeCourseRepo(courses);
  const authz = makeAuthz(opts.allow ?? true);
  const handler = new GetContinueWatchingHandler(progressRepo, courseRepo, authz);
  return { handler, progressRepo, courseRepo, authz };
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
      };
      const handler = new GetContinueWatchingHandler(progressRepo, courseRepo, authz);
      const result = await handler.execute(new GetContinueWatchingQuery(USER, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.courseId).toBe('course-1');
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

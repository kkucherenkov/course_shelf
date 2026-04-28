/**
 * Unit tests for GetRecentlyCompletedHandler.
 *
 * Scenarios:
 *   - Empty: no completed courses → empty items.
 *   - Happy path: returns completed items.
 *   - Authz filter: canSee=false drops a course.
 *   - Missing course in courseRepo (defensive) → item dropped.
 */
import { describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { GetRecentlyCompletedQuery } from './get-recently-completed.query';
import { GetRecentlyCompletedHandler } from './get-recently-completed.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');

const ADMIN = { id: 'admin-1', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

function makeCompletedProgressRow(courseId: string, lastSeenAt: Date): CourseProgressReadModel {
  return CourseProgressReadModel.create({
    id: `cprm-${courseId}`,
    userId: USER.id,
    courseId,
    lessonsCompleted: 5,
    lessonsTotal: 5,
    percent: 100,
    lastSeenAt,
    lastSeenLessonId: 'lesson-5',
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
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn().mockResolvedValue(rows),
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
  return {
    handler: new GetRecentlyCompletedHandler(progressRepo, courseRepo, authz),
    progressRepo,
    courseRepo,
    authz,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetRecentlyCompletedHandler', () => {
  describe('empty result', () => {
    it('returns empty items when user has no completed courses', async () => {
      const { handler } = makeHandler({ rows: [] });
      const result = await handler.execute(new GetRecentlyCompletedQuery(USER, 10));

      expect(result.items).toEqual([]);
    });
  });

  describe('happy path', () => {
    it('returns completed items in lastSeenAt DESC order (as provided by adapter)', async () => {
      const rows = [
        makeCompletedProgressRow('course-1', NOW),
        makeCompletedProgressRow('course-2', EARLIER),
      ];
      const courses = [makeCourse('course-1'), makeCourse('course-2')];
      const { handler } = makeHandler({ rows, courses, allow: true });
      const result = await handler.execute(new GetRecentlyCompletedQuery(ADMIN, 10));

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.courseId).toBe('course-1');
      expect(result.items[1]?.courseId).toBe('course-2');
    });

    it('maps lastSeenAt to completedAt in the DTO', async () => {
      const row = makeCompletedProgressRow('course-1', NOW);
      const course = makeCourse('course-1');
      const { handler } = makeHandler({ rows: [row], courses: [course], allow: true });
      const result = await handler.execute(new GetRecentlyCompletedQuery(ADMIN, 10));

      expect(result.items[0]?.completedAt).toBe(NOW.toISOString());
      expect(result.items[0]?.lessonsTotal).toBe(5);
    });
  });

  describe('authz filter', () => {
    it('drops courses where canSee returns false', async () => {
      const rows = [
        makeCompletedProgressRow('course-1', NOW),
        makeCompletedProgressRow('course-2', EARLIER),
      ];
      const courses = [makeCourse('course-1'), makeCourse('course-2')];
      const progressRepo = makeProgressRepo(rows);
      const courseRepo = makeCourseRepo(courses);
      const authz: AuthorizationService = {
        canSee: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        invalidate: vi.fn(),
      };
      const handler = new GetRecentlyCompletedHandler(progressRepo, courseRepo, authz);
      const result = await handler.execute(new GetRecentlyCompletedQuery(USER, 10));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.courseId).toBe('course-1');
    });
  });

  describe('defensive: missing course', () => {
    it('drops items when course is not found in courseRepo', async () => {
      const row = makeCompletedProgressRow('course-missing', NOW);
      // courseRepo returns empty — simulates a race where the course was deleted
      const { handler } = makeHandler({ rows: [row], courses: [], allow: true });
      const result = await handler.execute(new GetRecentlyCompletedQuery(USER, 10));

      expect(result.items).toEqual([]);
    });
  });
});

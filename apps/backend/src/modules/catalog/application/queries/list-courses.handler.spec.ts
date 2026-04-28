import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { ListCoursesQuery } from './list-courses.query';
import { ListCoursesHandler } from './list-courses.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeRepo(): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findRecentlyAdded: vi.fn(),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
  };
}

function makeProgressRepo(rows: CourseProgressReadModel[] = []): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn(),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn().mockResolvedValue(rows),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
  };
}

function makeCourse(
  overrides: Partial<{ id: string; libraryId: string; slug: string }> = {},
): Course {
  return Course.create({
    id: overrides.id ?? 'course-1',
    libraryId: overrides.libraryId ?? 'lib-1',
    slug: overrides.slug ?? 'my-course',
    title: 'My Course',
    now: NOW,
  });
}

function makeProgressRow(courseId: string): CourseProgressReadModel {
  return CourseProgressReadModel.create({
    id: `cprm-${courseId}`,
    userId: 'user-1',
    courseId,
    lessonsCompleted: 2,
    lessonsTotal: 5,
    percent: 40,
    lastSeenAt: NOW,
    lastSeenLessonId: 'lesson-1',
  });
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ListCoursesHandler', () => {
  let repo: CourseRepository;
  let handler: ListCoursesHandler;

  describe('admin gets all courses', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(true);
      handler = new ListCoursesHandler(repo, authz, makeProgressRepo());
    });

    it('returns empty array when no courses', async () => {
      vi.mocked(repo.findAll).mockResolvedValue([]);

      const result = await handler.execute(new ListCoursesQuery(adminActor));

      expect(result).toEqual([]);
    });

    it('returns all courses mapped to DTOs', async () => {
      const courses = [
        makeCourse({ id: 'c1', slug: 'course-a' }),
        makeCourse({ id: 'c2', slug: 'course-b' }),
      ];
      vi.mocked(repo.findAll).mockResolvedValue(courses);

      const result = await handler.execute(new ListCoursesQuery(adminActor));

      expect(result).toHaveLength(2);
    });

    it('uses findManyByLibrary when libraryId is provided', async () => {
      vi.mocked(repo.findManyByLibrary).mockResolvedValue([]);

      await handler.execute(new ListCoursesQuery(adminActor, 'lib-1'));

      expect(repo.findManyByLibrary).toHaveBeenCalledWith('lib-1');
      expect(repo.findAll).not.toHaveBeenCalled();
    });
  });

  describe('progress populated from projection', () => {
    it('returns projection progress when row exists', async () => {
      repo = makeRepo();
      const course = makeCourse({ id: 'c1', slug: 'course-a' });
      vi.mocked(repo.findAll).mockResolvedValue([course]);

      const progressRow = makeProgressRow('c1');
      const progressRepo = makeProgressRepo([progressRow]);
      const authz = makeAuthz(true);
      handler = new ListCoursesHandler(repo, authz, progressRepo);

      const result = await handler.execute(new ListCoursesQuery(adminActor));

      expect(result[0]?.progress.percent).toBe(40);
      expect(result[0]?.progress.lessonsCompleted).toBe(2);
      expect(result[0]?.progress.lessonsTotal).toBe(5);
    });

    it('returns zero placeholder when no projection row exists', async () => {
      repo = makeRepo();
      const course = makeCourse({ id: 'c1' });
      vi.mocked(repo.findAll).mockResolvedValue([course]);

      const progressRepo = makeProgressRepo([]); // no rows
      const authz = makeAuthz(true);
      handler = new ListCoursesHandler(repo, authz, progressRepo);

      const result = await handler.execute(new ListCoursesQuery(adminActor));

      expect(result[0]?.progress).toEqual({ percent: 0, lessonsCompleted: 0, lessonsTotal: 0 });
    });

    it('uses single bulk call — findManyByCourseIdsForUser called once', async () => {
      repo = makeRepo();
      const courses = [makeCourse({ id: 'c1' }), makeCourse({ id: 'c2', slug: 'course-2' })];
      vi.mocked(repo.findAll).mockResolvedValue(courses);

      const progressRepo = makeProgressRepo([]);
      const authz = makeAuthz(true);
      handler = new ListCoursesHandler(repo, authz, progressRepo);

      await handler.execute(new ListCoursesQuery(adminActor));

      expect(progressRepo.findManyByCourseIdsForUser).toHaveBeenCalledOnce();
    });
  });

  describe('non-admin with library grant gets matching subset', () => {
    it('returns only courses from libraries the user has access to', async () => {
      repo = makeRepo();
      const c1 = makeCourse({ id: 'c1', libraryId: 'lib-1' });
      const c2 = makeCourse({ id: 'c2', libraryId: 'lib-2', slug: 'course-2' });

      vi.mocked(repo.findAll).mockResolvedValue([c1, c2]);

      const authz: AuthorizationService = {
        canSee: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        invalidate: vi.fn(),
      };
      handler = new ListCoursesHandler(repo, authz, makeProgressRepo());

      const result = await handler.execute(new ListCoursesQuery(userActor));

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('c1');
    });
  });

  describe('non-admin with no grants gets empty list', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(false);
      handler = new ListCoursesHandler(repo, authz, makeProgressRepo());
    });

    it('returns empty array even when courses exist', async () => {
      vi.mocked(repo.findAll).mockResolvedValue([makeCourse()]);

      const result = await handler.execute(new ListCoursesQuery(userActor));

      expect(result).toEqual([]);
    });

    it('calls canSee for each course', async () => {
      const authz = makeAuthz(false);
      handler = new ListCoursesHandler(repo, authz, makeProgressRepo());
      vi.mocked(repo.findAll).mockResolvedValue([
        makeCourse({ id: 'c1' }),
        makeCourse({ id: 'c2', slug: 'other' }),
      ]);

      await handler.execute(new ListCoursesQuery(userActor));

      expect(authz.canSee).toHaveBeenCalledTimes(2);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { GetCourseQuery } from './get-course.query';
import { GetCourseHandler } from './get-course.handler';

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
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeProgressRepo(
  row: CourseProgressReadModel | null = null,
): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn().mockResolvedValue(row),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
    deleteByUserAndCourse: vi.fn(),
  };
}

function makeCourse(): Course {
  return Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: NOW,
  });
}

function makeProgressRow(): CourseProgressReadModel {
  return CourseProgressReadModel.create({
    id: 'cprm-1',
    userId: 'admin-1',
    courseId: 'course-1',
    lessonsCompleted: 3,
    lessonsTotal: 10,
    percent: 30,
    lastSeenAt: NOW,
    lastSeenLessonId: 'lesson-3',
  });
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetCourseHandler', () => {
  let repo: CourseRepository;
  let handler: GetCourseHandler;

  describe('admin found — no projection row', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(true);
      handler = new GetCourseHandler(repo, authz, makeProgressRepo(null));
    });

    it('returns CourseDto with zero progress placeholder when no projection row', async () => {
      const course = makeCourse();
      vi.mocked(repo.findById).mockResolvedValue(course);

      const result = await handler.execute(new GetCourseQuery('course-1', adminActor));

      expect(result.id).toBe('course-1');
      expect(result.slug).toBe('my-course');
      expect(result.progress).toEqual({ percent: 0, lessonsCompleted: 0, lessonsTotal: 0 });
    });
  });

  describe('progress populated from projection', () => {
    it('returns projection values when row exists', async () => {
      repo = makeRepo();
      const course = makeCourse();
      vi.mocked(repo.findById).mockResolvedValue(course);

      const progressRow = makeProgressRow();
      handler = new GetCourseHandler(repo, makeAuthz(true), makeProgressRepo(progressRow));

      const result = await handler.execute(new GetCourseQuery('course-1', adminActor));

      expect(result.progress.percent).toBe(30);
      expect(result.progress.lessonsCompleted).toBe(3);
      expect(result.progress.lessonsTotal).toBe(10);
    });

    it('reads from projection repo — findByUserAndCourse called', async () => {
      repo = makeRepo();
      vi.mocked(repo.findById).mockResolvedValue(makeCourse());

      const progressRepo = makeProgressRepo(null);
      handler = new GetCourseHandler(repo, makeAuthz(true), progressRepo);

      await handler.execute(new GetCourseQuery('course-1', adminActor));

      expect(progressRepo.findByUserAndCourse).toHaveBeenCalledWith('admin-1', 'course-1');
    });
  });

  describe('non-admin without grant', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(false);
      handler = new GetCourseHandler(repo, authz, makeProgressRepo(null));
    });

    it('throws PermissionDenied when course exists but no grant', async () => {
      vi.mocked(repo.findById).mockResolvedValue(makeCourse());

      await expect(
        handler.execute(new GetCourseQuery('course-1', userActor)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('missing course', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(true);
      handler = new GetCourseHandler(repo, authz, makeProgressRepo(null));
    });

    it('throws CourseNotFoundError when course does not exist', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(
        handler.execute(new GetCourseQuery('missing', adminActor)),
      ).rejects.toBeInstanceOf(CourseNotFoundError);
    });
  });
});

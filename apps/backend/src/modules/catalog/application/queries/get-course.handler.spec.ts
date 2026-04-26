import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { GetCourseQuery } from './get-course.query';
import { GetCourseHandler } from './get-course.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRepo(): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
  };
}

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
  };
}

function makeCourse(): Course {
  return Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
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

  describe('admin found', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(true);
      handler = new GetCourseHandler(repo, authz);
    });

    it('returns CourseDto when course exists', async () => {
      const course = makeCourse();
      vi.mocked(repo.findById).mockResolvedValue(course);

      const result = await handler.execute(new GetCourseQuery('course-1', adminActor));

      expect(result.id).toBe('course-1');
      expect(result.slug).toBe('my-course');
      expect(result.progress).toEqual({ percent: 0, lessonsCompleted: 0, lessonsTotal: 0 });
    });
  });

  describe('non-admin without grant', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(false);
      handler = new GetCourseHandler(repo, authz);
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
      handler = new GetCourseHandler(repo, authz);
    });

    it('throws CourseNotFoundError when course does not exist', async () => {
      vi.mocked(repo.findById).mockResolvedValue(null);

      await expect(
        handler.execute(new GetCourseQuery('missing', adminActor)),
      ).rejects.toBeInstanceOf(CourseNotFoundError);
    });
  });
});

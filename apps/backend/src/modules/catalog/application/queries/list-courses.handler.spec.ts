import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { ListCoursesQuery } from './list-courses.query';
import { ListCoursesHandler } from './list-courses.handler';

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

function makeCourse(
  overrides: Partial<{ id: string; libraryId: string; slug: string }> = {},
): Course {
  return Course.create({
    id: overrides.id ?? 'course-1',
    libraryId: overrides.libraryId ?? 'lib-1',
    slug: overrides.slug ?? 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
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
      handler = new ListCoursesHandler(repo, authz);
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

  describe('non-admin with library grant gets matching subset', () => {
    it('returns only courses from libraries the user has access to', async () => {
      repo = makeRepo();
      const c1 = makeCourse({ id: 'c1', libraryId: 'lib-1' });
      const c2 = makeCourse({ id: 'c2', libraryId: 'lib-2', slug: 'course-2' });

      vi.mocked(repo.findAll).mockResolvedValue([c1, c2]);

      // canSee: true for lib-1, false for lib-2
      const authz: AuthorizationService = {
        canSee: vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false),
        invalidate: vi.fn(),
      };
      handler = new ListCoursesHandler(repo, authz);

      const result = await handler.execute(new ListCoursesQuery(userActor));

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('c1');
    });
  });

  describe('non-admin with no grants gets empty list', () => {
    beforeEach(() => {
      repo = makeRepo();
      const authz = makeAuthz(false);
      handler = new ListCoursesHandler(repo, authz);
    });

    it('returns empty array even when courses exist', async () => {
      vi.mocked(repo.findAll).mockResolvedValue([makeCourse()]);

      const result = await handler.execute(new ListCoursesQuery(userActor));

      expect(result).toEqual([]);
    });

    it('calls canSee for each course', async () => {
      const authz = makeAuthz(false);
      handler = new ListCoursesHandler(repo, authz);
      vi.mocked(repo.findAll).mockResolvedValue([
        makeCourse({ id: 'c1' }),
        makeCourse({ id: 'c2', slug: 'other' }),
      ]);

      await handler.execute(new ListCoursesQuery(userActor));

      expect(authz.canSee).toHaveBeenCalledTimes(2);
    });
  });
});

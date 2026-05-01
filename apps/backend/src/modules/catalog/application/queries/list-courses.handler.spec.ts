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
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
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
    deleteByUserAndCourse: vi.fn(),
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

// Browse-page filter/sort helpers (E14-F01-S02).
function statusProgressRow(courseId: string, percent: number): CourseProgressReadModel {
  return CourseProgressReadModel.create({
    id: `cprm-${courseId}`,
    userId: 'user-1',
    courseId,
    lessonsCompleted: percent === 100 ? 5 : Math.round((percent / 100) * 5),
    lessonsTotal: 5,
    percent,
    lastSeenAt: NOW,
    lastSeenLessonId: 'lesson-1',
  });
}

function buildStatusHandler(progressRows: CourseProgressReadModel[]): ListCoursesHandler {
  const r = makeRepo();
  vi.mocked(r.findAll).mockResolvedValue([
    makeCourse({ id: 'c-not', slug: 'not-started' }),
    makeCourse({ id: 'c-mid', slug: 'in-progress' }),
    makeCourse({ id: 'c-done', slug: 'completed' }),
  ]);
  return new ListCoursesHandler(r, makeAuthz(true), makeProgressRepo(progressRows));
}

function makeCourseWithDates(
  id: string,
  title: string,
  createdOffsetDays: number,
  updatedOffsetDays: number,
): Course {
  const created = new Date(NOW.getTime() + createdOffsetDays * 24 * 3600 * 1000);
  const updated = new Date(NOW.getTime() + updatedOffsetDays * 24 * 3600 * 1000);
  const c = Course.create({
    id,
    libraryId: 'lib-1',
    slug: id,
    title,
    now: created,
  });
  // Force updatedAt for sort coverage. Course.create sets both to `now`.
  Object.defineProperty(c, 'updatedAt', { value: updated, configurable: true });
  return c;
}

function buildSortHandler(courses: Course[]): ListCoursesHandler {
  const r = makeRepo();
  vi.mocked(r.findAll).mockResolvedValue(courses);
  return new ListCoursesHandler(r, makeAuthz(true), makeProgressRepo());
}

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
        listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
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

  // ---------------------------------------------------------------------------
  // Browse-page filters + sort (E14-F01-S02)
  // ---------------------------------------------------------------------------

  describe('status filter', () => {
    it('returns all when status=all', async () => {
      const h = buildStatusHandler([
        statusProgressRow('c-mid', 50),
        statusProgressRow('c-done', 100),
      ]);
      const result = await h.execute(new ListCoursesQuery(adminActor, undefined, 'all'));
      expect(result.map((d) => d.id).toSorted()).toEqual(['c-done', 'c-mid', 'c-not']);
    });

    it('keeps only courses with percent === 100 when status=completed', async () => {
      const h = buildStatusHandler([
        statusProgressRow('c-mid', 50),
        statusProgressRow('c-done', 100),
      ]);
      const result = await h.execute(new ListCoursesQuery(adminActor, undefined, 'completed'));
      expect(result.map((d) => d.id)).toEqual(['c-done']);
    });

    it('keeps only courses with 0 < percent < 100 when status=in-progress', async () => {
      const h = buildStatusHandler([
        statusProgressRow('c-mid', 50),
        statusProgressRow('c-done', 100),
      ]);
      const result = await h.execute(new ListCoursesQuery(adminActor, undefined, 'in-progress'));
      expect(result.map((d) => d.id)).toEqual(['c-mid']);
    });

    it('keeps only courses with percent === 0 when status=not-started', async () => {
      const h = buildStatusHandler([
        statusProgressRow('c-mid', 50),
        statusProgressRow('c-done', 100),
      ]);
      const result = await h.execute(new ListCoursesQuery(adminActor, undefined, 'not-started'));
      expect(result.map((d) => d.id)).toEqual(['c-not']);
    });
  });

  describe('sort', () => {
    it('recently-watched sorts by updatedAt desc (default)', async () => {
      const h = buildSortHandler([
        makeCourseWithDates('a', 'Apples', 0, 1),
        makeCourseWithDates('b', 'Bananas', 0, 5),
        makeCourseWithDates('c', 'Cherries', 0, 3),
      ]);
      const result = await h.execute(new ListCoursesQuery(adminActor));
      expect(result.map((d) => d.id)).toEqual(['b', 'c', 'a']);
    });

    it('newest sorts by createdAt desc', async () => {
      const h = buildSortHandler([
        makeCourseWithDates('a', 'Apples', 0, 0),
        makeCourseWithDates('b', 'Bananas', 5, 0),
        makeCourseWithDates('c', 'Cherries', 3, 0),
      ]);
      const result = await h.execute(
        new ListCoursesQuery(adminActor, undefined, 'all', 'newest'),
      );
      expect(result.map((d) => d.id)).toEqual(['b', 'c', 'a']);
    });

    it('alphabetical sorts by title asc', async () => {
      const h = buildSortHandler([
        makeCourseWithDates('a', 'Cherries', 0, 0),
        makeCourseWithDates('b', 'Apples', 0, 0),
        makeCourseWithDates('c', 'Bananas', 0, 0),
      ]);
      const result = await h.execute(
        new ListCoursesQuery(adminActor, undefined, 'all', 'alphabetical'),
      );
      expect(result.map((d) => d.title)).toEqual(['Apples', 'Bananas', 'Cherries']);
    });
  });
});

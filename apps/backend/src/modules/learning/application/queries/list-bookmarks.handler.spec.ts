/**
 * Unit tests for ListBookmarksHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { Bookmark } from '../../domain/bookmark/bookmark';

import { ListBookmarksQuery } from './list-bookmarks.query';
import { ListBookmarksHandler } from './list-bookmarks.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

const ADMIN = { id: 'user-admin', role: 'admin' };
const USER = { id: 'user-1', role: 'user' };

const LESSON = { id: 'lesson-1', courseId: 'course-1', title: 'L1', videoPath: '/v' } as never;
const COURSE = { id: 'course-1', libraryId: 'lib-1', slug: 'c1' } as never;

function makeLessonRepo(lesson: unknown = LESSON): LessonRepository {
  return { findById: vi.fn().mockResolvedValue(lesson) } as unknown as LessonRepository;
}

function makeCourseRepo(course: unknown = COURSE): CourseRepository {
  return { findById: vi.fn().mockResolvedValue(course) } as unknown as CourseRepository;
}

function makeAuthz(allowed = true): AuthorizationService {
  return { canSee: vi.fn().mockResolvedValue(allowed), invalidate: vi.fn() };
}

function makeBookmarkRepo(bookmarks: Bookmark[] = []): BookmarkRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findManyByUserAndLesson: vi.fn().mockResolvedValue(bookmarks),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeBookmark(positionSeconds: number, label?: string): Bookmark {
  return Bookmark.create({
    id: `bm-${String(positionSeconds)}`,
    userId: USER.id,
    lessonId: 'lesson-1',
    positionSeconds,
    ...(label === undefined ? {} : { label }),
  });
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    bookmarks?: Bookmark[];
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const bookmarkRepo = makeBookmarkRepo(opts.bookmarks ?? []);

  const handler = new ListBookmarksHandler(lessonRepo, courseRepo, authz, bookmarkRepo);
  return { handler, lessonRepo, courseRepo, authz, bookmarkRepo };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ListBookmarksHandler', () => {
  describe('happy path', () => {
    it('returns empty items for a lesson with no bookmarks', async () => {
      const { handler } = makeHandler();
      const result = await handler.execute(new ListBookmarksQuery('lesson-1', ADMIN));
      expect(result.items).toEqual([]);
    });

    it('admin sees their own bookmarks', async () => {
      const bm = makeBookmark(30, 'note');
      const { handler } = makeHandler({ bookmarks: [bm] });
      const result = await handler.execute(new ListBookmarksQuery('lesson-1', ADMIN));
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.id).toBe(bm.id);
    });

    it('non-admin with grant receives bookmarks', async () => {
      const bm = makeBookmark(10);
      const { handler } = makeHandler({ allowed: true, bookmarks: [bm] });
      const result = await handler.execute(new ListBookmarksQuery('lesson-1', USER));
      expect(result.items).toHaveLength(1);
    });

    it('items carry positionSeconds ascending (as returned by repo)', async () => {
      const bm1 = makeBookmark(10);
      const bm2 = makeBookmark(50);
      const { handler } = makeHandler({ bookmarks: [bm1, bm2] });
      const result = await handler.execute(new ListBookmarksQuery('lesson-1', ADMIN));

      expect(result.items[0]?.positionSeconds).toBe(10);
      expect(result.items[1]?.positionSeconds).toBe(50);
    });

    it('queries only the actor bookmarks (findManyByUserAndLesson arg)', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(new ListBookmarksQuery('lesson-1', USER));

      expect(bookmarkRepo.findManyByUserAndLesson).toHaveBeenCalledWith(USER.id, 'lesson-1');
    });
  });

  describe('authorization', () => {
    it('non-admin without grant throws PermissionDenied', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(
        handler.execute(new ListBookmarksQuery('lesson-1', USER)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('error cases', () => {
    it('throws LessonNotFoundError when lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      await expect(
        handler.execute(new ListBookmarksQuery('lesson-1', ADMIN)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });

    it('throws LessonNotFoundError when parent course is missing (orphan lesson)', async () => {
      const { handler } = makeHandler({ course: null });
      await expect(
        handler.execute(new ListBookmarksQuery('lesson-1', ADMIN)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });
});

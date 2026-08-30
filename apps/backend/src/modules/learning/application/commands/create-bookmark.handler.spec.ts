/**
 * Unit tests for CreateBookmarkHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { Bookmark } from '../../domain/bookmark/bookmark';
import { BookmarkIdempotencyConflictError } from '../../domain/bookmark/bookmark.errors';

import { CreateBookmarkCommand } from './create-bookmark.command';
import { CreateBookmarkHandler } from './create-bookmark.handler';

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
  return {
    canSee: vi.fn().mockResolvedValue(allowed),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeBookmarkRepo(
  opts: {
    existingByKey?: Bookmark | null;
    saveRejectsWith?: unknown;
  } = {},
): BookmarkRepository {
  const save = opts.saveRejectsWith
    ? vi.fn().mockRejectedValue(opts.saveRejectsWith)
    : vi.fn().mockResolvedValue(undefined);
  return {
    save,
    findById: vi.fn().mockResolvedValue(null),
    findByIdempotencyKey: vi.fn().mockResolvedValue(opts.existingByKey ?? null),
    findManyByUserAndLesson: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    bookmarkRepo?: BookmarkRepository;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const bookmarkRepo = opts.bookmarkRepo ?? makeBookmarkRepo();

  const handler = new CreateBookmarkHandler(lessonRepo, courseRepo, authz, bookmarkRepo);
  return { handler, lessonRepo, courseRepo, authz, bookmarkRepo };
}

function makeCommand(
  actor = ADMIN,
  positionSeconds = 30,
  label?: string,
  idempotencyKey?: string,
): CreateBookmarkCommand {
  return new CreateBookmarkCommand('lesson-1', positionSeconds, label, idempotencyKey, actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateBookmarkHandler', () => {
  describe('happy path', () => {
    it('admin creates a bookmark and returns DTO with created: true', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      const result = await handler.execute(makeCommand());

      expect(bookmarkRepo.save).toHaveBeenCalledOnce();
      expect(result.created).toBe(true);
      expect(result.bookmark.lessonId).toBe('lesson-1');
      expect(result.bookmark.positionSeconds).toBe(30);
    });

    it('non-admin with grant creates bookmark successfully', async () => {
      const { handler, bookmarkRepo } = makeHandler({ allowed: true });
      const result = await handler.execute(makeCommand(USER));

      expect(bookmarkRepo.save).toHaveBeenCalledOnce();
      expect(result.bookmark.positionSeconds).toBe(30);
    });

    it('persists bookmark with actor.id as userId (ownership stamp)', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(makeCommand(USER));

      const saved = vi.mocked(bookmarkRepo.save).mock.calls[0]?.[0];
      expect(saved?.userId).toBe(USER.id);
    });

    it('persists bookmark with label when provided', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(makeCommand(ADMIN, 30, 'my label'));

      const saved = vi.mocked(bookmarkRepo.save).mock.calls[0]?.[0];
      expect(saved?.label).toBe('my label');
    });

    it('persists bookmark without label when not provided', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(makeCommand(ADMIN, 30, undefined));

      const saved = vi.mocked(bookmarkRepo.save).mock.calls[0]?.[0];
      expect(saved?.label).toBeUndefined();
    });

    it('returned DTO includes createdAt and updatedAt ISO strings', async () => {
      const { handler } = makeHandler();
      const result = await handler.execute(makeCommand());

      expect(result.bookmark.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.bookmark.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('idempotency (#285)', () => {
    it('persists the idempotencyKey when provided', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(makeCommand(ADMIN, 30, undefined, 'retry-key-1'));

      const saved = vi.mocked(bookmarkRepo.save).mock.calls[0]?.[0];
      expect(saved?.idempotencyKey).toBe('retry-key-1');
    });

    it('a retry with a key already seen returns the existing bookmark, created: false, no new save', async () => {
      const existing = Bookmark.reconstitute({
        id: 'bm-existing',
        userId: ADMIN.id,
        lessonId: 'lesson-1',
        positionSeconds: 30,
        label: undefined,
        idempotencyKey: 'retry-key-1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
      const bookmarkRepo = makeBookmarkRepo({ existingByKey: existing });
      const { handler } = makeHandler({ bookmarkRepo });

      const result = await handler.execute(
        makeCommand(ADMIN, 999, 'different label', 'retry-key-1'),
      );

      expect(result.created).toBe(false);
      expect(result.bookmark.id).toBe('bm-existing');
      // The retry's (differing) payload is ignored — the stored bookmark wins.
      expect(result.bookmark.positionSeconds).toBe(30);
      expect(bookmarkRepo.save).not.toHaveBeenCalled();
    });

    it('without an idempotencyKey, two calls each create a new bookmark (no lookup)', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      await handler.execute(makeCommand());
      await handler.execute(makeCommand());

      expect(bookmarkRepo.findByIdempotencyKey).not.toHaveBeenCalled();
      expect(bookmarkRepo.save).toHaveBeenCalledTimes(2);
    });

    it('a race lost to a concurrent identical create re-fetches and returns the winner', async () => {
      const winner = Bookmark.reconstitute({
        id: 'bm-winner',
        userId: ADMIN.id,
        lessonId: 'lesson-1',
        positionSeconds: 30,
        label: undefined,
        idempotencyKey: 'retry-key-1',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      });
      // findByIdempotencyKey misses on the pre-check (the race is genuinely
      // concurrent) but hits once save() reports the conflict.
      const bookmarkRepo = makeBookmarkRepo({
        saveRejectsWith: new BookmarkIdempotencyConflictError(),
      });
      vi.mocked(bookmarkRepo.findByIdempotencyKey).mockResolvedValueOnce(null); // pre-check
      vi.mocked(bookmarkRepo.findByIdempotencyKey).mockResolvedValueOnce(winner); // post-conflict re-fetch
      const { handler } = makeHandler({ bookmarkRepo });

      const result = await handler.execute(makeCommand(ADMIN, 30, undefined, 'retry-key-1'));

      expect(result.created).toBe(false);
      expect(result.bookmark.id).toBe('bm-winner');
    });
  });

  describe('authorization', () => {
    it('non-admin without grant throws PermissionDenied', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(handler.execute(makeCommand(USER))).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('error cases', () => {
    it('throws LessonNotFoundError when lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      await expect(handler.execute(makeCommand())).rejects.toBeInstanceOf(LessonNotFoundError);
    });

    it('throws LessonNotFoundError when parent course is missing (orphan lesson)', async () => {
      const { handler } = makeHandler({ course: null });
      await expect(handler.execute(makeCommand())).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });
});

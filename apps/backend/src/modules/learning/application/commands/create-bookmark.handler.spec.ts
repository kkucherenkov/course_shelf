/**
 * Unit tests for CreateBookmarkHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';

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
  return { canSee: vi.fn().mockResolvedValue(allowed), invalidate: vi.fn() };
}

function makeBookmarkRepo(): BookmarkRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findManyByUserAndLesson: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const bookmarkRepo = makeBookmarkRepo();

  const handler = new CreateBookmarkHandler(lessonRepo, courseRepo, authz, bookmarkRepo);
  return { handler, lessonRepo, courseRepo, authz, bookmarkRepo };
}

function makeCommand(actor = ADMIN, positionSeconds = 30, label?: string): CreateBookmarkCommand {
  return new CreateBookmarkCommand('lesson-1', positionSeconds, label, actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreateBookmarkHandler', () => {
  describe('happy path', () => {
    it('admin creates a bookmark and returns DTO', async () => {
      const { handler, bookmarkRepo } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(bookmarkRepo.save).toHaveBeenCalledOnce();
      expect(dto.lessonId).toBe('lesson-1');
      expect(dto.positionSeconds).toBe(30);
    });

    it('non-admin with grant creates bookmark successfully', async () => {
      const { handler, bookmarkRepo } = makeHandler({ allowed: true });
      const dto = await handler.execute(makeCommand(USER));

      expect(bookmarkRepo.save).toHaveBeenCalledOnce();
      expect(dto.positionSeconds).toBe(30);
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
      const dto = await handler.execute(makeCommand());

      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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

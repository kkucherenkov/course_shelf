/**
 * Unit tests for DeleteNoteHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';

import { DeleteNoteCommand } from './delete-note.command';
import { DeleteNoteHandler } from './delete-note.handler';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseRepository, LessonRepository } from '../../../../common/catalog-tokens';
import type { NoteRepository } from '../../domain/note/note.repository';

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

function makeNoteRepo(deleteResult = false): NoteRepository {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    findByUserAndLesson: vi.fn().mockResolvedValue(null),
    deleteByUserAndLesson: vi.fn().mockResolvedValue(deleteResult),
  };
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    deleteResult?: boolean;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const noteRepo = makeNoteRepo(opts.deleteResult ?? true);

  const handler = new DeleteNoteHandler(lessonRepo, courseRepo, authz, noteRepo);
  return { handler, lessonRepo, courseRepo, authz, noteRepo };
}

function makeCommand(actor = ADMIN): DeleteNoteCommand {
  return new DeleteNoteCommand('lesson-1', actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeleteNoteHandler', () => {
  describe('happy path', () => {
    it('deletes note when present and actor has grant', async () => {
      const { handler, noteRepo } = makeHandler({ deleteResult: true });
      await handler.execute(makeCommand());
      expect(noteRepo.deleteByUserAndLesson).toHaveBeenCalledWith(ADMIN.id, 'lesson-1');
    });

    it('is idempotent: succeeds (no error) when note does not exist', async () => {
      const { handler } = makeHandler({ deleteResult: false });
      await expect(handler.execute(makeCommand())).resolves.toBeUndefined();
    });

    it('non-admin with grant deletes successfully', async () => {
      const { handler, noteRepo } = makeHandler({ allowed: true });
      await handler.execute(makeCommand(USER));
      expect(noteRepo.deleteByUserAndLesson).toHaveBeenCalledWith(USER.id, 'lesson-1');
    });
  });

  describe('authorization', () => {
    it('non-admin without grant throws PermissionDenied', async () => {
      const { handler } = makeHandler({ allowed: false });
      await expect(handler.execute(makeCommand(USER))).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('no-oracle rule', () => {
    it('throws PermissionDenied (not LessonNotFoundError) when lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      const err = await handler.execute(makeCommand()).catch((error: unknown) => error);
      expect(err).toBeInstanceOf(PermissionDenied);
    });

    it('throws PermissionDenied (not LessonNotFoundError) when parent course is missing', async () => {
      const { handler } = makeHandler({ course: null });
      const err = await handler.execute(makeCommand()).catch((error: unknown) => error);
      expect(err).toBeInstanceOf(PermissionDenied);
    });
  });
});

/**
 * Unit tests for UpsertNoteHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { LessonNotFoundError } from '../../../../common/catalog-tokens';
import { Note } from '../../domain/note/note';

import { UpsertNoteCommand } from './upsert-note.command';
import { UpsertNoteHandler } from './upsert-note.handler';

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
  return {
    canSee: vi.fn().mockResolvedValue(allowed),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeNoteRepo(existing: Note | null = null): NoteRepository {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    findByUserAndLesson: vi.fn().mockResolvedValue(existing),
    deleteByUserAndLesson: vi.fn().mockResolvedValue(false),
  };
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    existing?: Note | null;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const noteRepo = makeNoteRepo(opts.existing ?? null);

  const handler = new UpsertNoteHandler(lessonRepo, courseRepo, authz, noteRepo);
  return { handler, lessonRepo, courseRepo, authz, noteRepo };
}

function makeCommand(actor = ADMIN, body = 'My note'): UpsertNoteCommand {
  return new UpsertNoteCommand('lesson-1', body, actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UpsertNoteHandler', () => {
  describe('happy path — create (no existing note)', () => {
    it('admin creates a new note and returns DTO', async () => {
      const { handler, noteRepo } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(noteRepo.upsert).toHaveBeenCalledOnce();
      expect(dto.lessonId).toBe('lesson-1');
      expect(dto.body).toBe('My note');
    });

    it('stamps actor.id as userId', async () => {
      const { handler, noteRepo } = makeHandler();
      await handler.execute(makeCommand(USER));

      const saved = vi.mocked(noteRepo.upsert).mock.calls[0]?.[0];
      expect(saved?.userId).toBe(USER.id);
    });

    it('DTO includes id, createdAt, updatedAt ISO strings', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(makeCommand());

      expect(dto.id).toBeTruthy();
      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('non-admin with grant creates note successfully', async () => {
      const { handler, noteRepo } = makeHandler({ allowed: true });
      await handler.execute(makeCommand(USER));
      expect(noteRepo.upsert).toHaveBeenCalledOnce();
    });
  });

  describe('happy path — update (existing note)', () => {
    it('calls setBody on existing note instead of creating a duplicate', async () => {
      const existing = Note.create({
        id: 'note-existing',
        userId: USER.id,
        lessonId: 'lesson-1',
        body: 'old body',
      });
      const { handler, noteRepo } = makeHandler({ existing });
      const dto = await handler.execute(makeCommand(USER, 'new body'));

      // upsert called once with the existing note (not a new one)
      expect(noteRepo.upsert).toHaveBeenCalledOnce();
      const saved = vi.mocked(noteRepo.upsert).mock.calls[0]?.[0];
      expect(saved?.id).toBe('note-existing');
      expect(saved?.body).toBe('new body');
      expect(dto.id).toBe('note-existing');
      expect(dto.body).toBe('new body');
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

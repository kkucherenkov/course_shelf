/**
 * Unit tests for GetNoteHandler.
 * All ports mocked — no real DB or network.
 */
import { describe, expect, it, vi } from 'vitest';

import { PermissionDenied } from '../../../../shared/domain-error';
import { NoteNotFoundError } from '../../domain/note/note.errors';
import { Note } from '../../domain/note/note';

import { GetNoteQuery } from './get-note.query';
import { GetNoteHandler } from './get-note.handler';

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

function makeNoteRepo(existing: Note | null): NoteRepository {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    findByUserAndLesson: vi.fn().mockResolvedValue(existing),
    deleteByUserAndLesson: vi.fn().mockResolvedValue(false),
  };
}

function makeExistingNote(userId = ADMIN.id): Note {
  return Note.create({ id: 'note-1', userId, lessonId: 'lesson-1', body: 'hello' });
}

function makeHandler(
  opts: {
    lesson?: unknown;
    course?: unknown;
    allowed?: boolean;
    note?: Note | null;
  } = {},
) {
  const lessonRepo = makeLessonRepo('lesson' in opts ? opts.lesson : LESSON);
  const courseRepo = makeCourseRepo('course' in opts ? opts.course : COURSE);
  const authz = makeAuthz(opts.allowed ?? true);
  const noteRepo = makeNoteRepo('note' in opts ? (opts.note ?? null) : makeExistingNote());

  const handler = new GetNoteHandler(lessonRepo, courseRepo, authz, noteRepo);
  return { handler, lessonRepo, courseRepo, authz, noteRepo };
}

function makeQuery(actor = ADMIN): GetNoteQuery {
  return new GetNoteQuery('lesson-1', actor);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetNoteHandler', () => {
  describe('happy path', () => {
    it('returns NoteDto when note exists and actor has grant', async () => {
      const { handler } = makeHandler();
      const dto = await handler.execute(makeQuery());

      expect(dto.id).toBe('note-1');
      expect(dto.lessonId).toBe('lesson-1');
      expect(dto.body).toBe('hello');
      expect(dto.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(dto.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('non-admin with grant returns DTO', async () => {
      const { handler } = makeHandler({ allowed: true, note: makeExistingNote(USER.id) });
      const dto = await handler.execute(makeQuery(USER));
      expect(dto.body).toBe('hello');
    });
  });

  describe('note absent', () => {
    it('throws NoteNotFoundError when note absent but actor has grant', async () => {
      const { handler } = makeHandler({ note: null });
      await expect(handler.execute(makeQuery())).rejects.toBeInstanceOf(NoteNotFoundError);
    });
  });

  describe('authorization', () => {
    it('throws PermissionDenied when actor has no grant', async () => {
      const { handler } = makeHandler({ allowed: false, note: null });
      await expect(handler.execute(makeQuery(USER))).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('no-oracle rule', () => {
    it('throws PermissionDenied (not 404) when lesson is missing', async () => {
      const { handler } = makeHandler({ lesson: null });
      const err = await handler.execute(makeQuery()).catch((error: unknown) => error);
      expect(err).toBeInstanceOf(PermissionDenied);
    });

    it('throws PermissionDenied (not 404) when parent course is missing', async () => {
      const { handler } = makeHandler({ course: null });
      const err = await handler.execute(makeQuery()).catch((error: unknown) => error);
      expect(err).toBeInstanceOf(PermissionDenied);
    });
  });
});

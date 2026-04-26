/**
 * Unit tests for PrismaNoteRepository.
 * PrismaService is mocked at the delegate level — no real DB connection.
 * Covers:
 *   - upsert: called with correct where (composite unique), create, update payloads.
 *   - findByUserAndLesson: null DB row → null return.
 *   - findByUserAndLesson: row present → Note aggregate with correct fields.
 *   - deleteByUserAndLesson: returns true when a row was deleted (count > 0).
 *   - deleteByUserAndLesson: returns false when no row existed (count === 0).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Note } from '../domain/note/note';
import { PrismaNoteRepository } from './prisma-note.repository';

// ---------------------------------------------------------------------------
// Minimal PrismaService mock
// ---------------------------------------------------------------------------

interface NoteDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
}

function makePrisma(): { note: NoteDelegate } {
  return {
    note: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const T0 = new Date('2026-01-01T00:00:00.000Z');

function makeAggregate(): Note {
  return Note.create({ id: 'note-1', userId: 'user-1', lessonId: 'lesson-1', body: 'hello' });
}

function makeRow(
  overrides: Partial<{
    id: string;
    userId: string;
    lessonId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'note-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    body: 'hello',
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaNoteRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaNoteRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaNoteRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // upsert
  // -------------------------------------------------------------------------

  describe('upsert', () => {
    it('calls note.upsert with the composite unique index in the where clause', async () => {
      await repo.upsert(makeAggregate());

      expect(prisma.note.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.note.upsert).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        uq_note_user_lesson: { userId: 'user-1', lessonId: 'lesson-1' },
      });
    });

    it('includes id, userId, lessonId, body in the create payload', async () => {
      await repo.upsert(makeAggregate());

      const call = vi.mocked(prisma.note.upsert).mock.calls[0]?.[0];
      expect(call?.create.id).toBe('note-1');
      expect(call?.create.userId).toBe('user-1');
      expect(call?.create.lessonId).toBe('lesson-1');
      expect(call?.create.body).toBe('hello');
    });

    it('includes only body in the update payload', async () => {
      const note = Note.create({
        id: 'note-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        body: 'updated',
      });
      await repo.upsert(note);

      const call = vi.mocked(prisma.note.upsert).mock.calls[0]?.[0];
      expect(call?.update).toEqual({ body: 'updated' });
    });
  });

  // -------------------------------------------------------------------------
  // findByUserAndLesson
  // -------------------------------------------------------------------------

  describe('findByUserAndLesson', () => {
    it('returns null when no row found', async () => {
      vi.mocked(prisma.note.findUnique).mockResolvedValue(null);
      expect(await repo.findByUserAndLesson('user-1', 'lesson-1')).toBeNull();
    });

    it('reconstitutes Note aggregate when row is present', async () => {
      vi.mocked(prisma.note.findUnique).mockResolvedValue(makeRow());
      const note = await repo.findByUserAndLesson('user-1', 'lesson-1');
      expect(note).not.toBeNull();
      expect(note?.id).toBe('note-1');
      expect(note?.body).toBe('hello');
      expect(note?.createdAt).toEqual(T0);
    });

    it('passes composite unique index in where clause', async () => {
      vi.mocked(prisma.note.findUnique).mockResolvedValue(null);
      await repo.findByUserAndLesson('user-42', 'lesson-99');

      const call = vi.mocked(prisma.note.findUnique).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        uq_note_user_lesson: { userId: 'user-42', lessonId: 'lesson-99' },
      });
    });
  });

  // -------------------------------------------------------------------------
  // deleteByUserAndLesson
  // -------------------------------------------------------------------------

  describe('deleteByUserAndLesson', () => {
    it('returns true when a row was deleted', async () => {
      vi.mocked(prisma.note.deleteMany).mockResolvedValue({ count: 1 });
      const result = await repo.deleteByUserAndLesson('user-1', 'lesson-1');
      expect(result).toBe(true);
    });

    it('returns false when no row existed', async () => {
      vi.mocked(prisma.note.deleteMany).mockResolvedValue({ count: 0 });
      const result = await repo.deleteByUserAndLesson('user-1', 'lesson-1');
      expect(result).toBe(false);
    });

    it('passes where clause with userId and lessonId', async () => {
      vi.mocked(prisma.note.deleteMany).mockResolvedValue({ count: 0 });
      await repo.deleteByUserAndLesson('user-42', 'lesson-99');

      const call = vi.mocked(prisma.note.deleteMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ userId: 'user-42', lessonId: 'lesson-99' });
    });
  });
});

/**
 * Unit tests for PrismaFlashcardRepository.
 * PrismaService is mocked at the delegate level — no real DB connection.
 * Covers:
 *   - save: upsert called with the correct where/create/update payloads,
 *     including the full review schedule.
 *   - save: sourceCueId undefined -> null at the Prisma boundary.
 *   - findById: null DB row -> null return; sourceCueId null -> undefined.
 *   - findManyByUserAndLesson: filters by (userId, lessonId), orders by
 *     createdAt ASC.
 *   - findDueByUser: filters by (userId, dueAt <= now), orders by dueAt ASC,
 *     applies `take: limit`.
 *   - delete: delegates to prisma.flashcard.delete.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Flashcard } from '../domain/flashcard/flashcard';
import { PrismaFlashcardRepository } from './prisma-flashcard.repository';

// ---------------------------------------------------------------------------
// Minimal PrismaService mock
// ---------------------------------------------------------------------------

interface FlashcardDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function makePrisma(): { flashcard: FlashcardDelegate } {
  return {
    flashcard: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const T0 = new Date('2026-01-01T00:00:00.000Z');

function makeAggregate(sourceCueId?: string): Flashcard {
  return Flashcard.create({
    id: 'fc-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    front: 'Q?',
    back: 'A.',
    ...(sourceCueId === undefined ? {} : { sourceCueId }),
  });
}

function makeRow(
  overrides: Partial<{
    id: string;
    userId: string;
    lessonId: string;
    front: string;
    back: string;
    sourceCueId: string | null;
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    dueAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'fc-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    front: 'Q?',
    back: 'A.',
    sourceCueId: null,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: T0,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaFlashcardRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaFlashcardRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaFlashcardRepository(prisma as never);
  });

  describe('save', () => {
    it('calls flashcard.upsert with the correct where clause (id)', async () => {
      await repo.save(makeAggregate());

      expect(prisma.flashcard.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.flashcard.upsert).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ id: 'fc-1' });
    });

    it('maps sourceCueId undefined to null in the create payload', async () => {
      await repo.save(makeAggregate());

      const call = vi.mocked(prisma.flashcard.upsert).mock.calls[0]?.[0];
      expect(call?.create.sourceCueId).toBeNull();
    });

    it('passes sourceCueId through when defined', async () => {
      await repo.save(makeAggregate('cue-1'));

      const call = vi.mocked(prisma.flashcard.upsert).mock.calls[0]?.[0];
      expect(call?.create.sourceCueId).toBe('cue-1');
    });

    it('writes the full review schedule on create and update', async () => {
      const fc = makeAggregate();
      fc.grade(5, T0);
      await repo.save(fc);

      const call = vi.mocked(prisma.flashcard.upsert).mock.calls[0]?.[0];
      expect(call?.create.easeFactor).toBe(fc.schedule.easeFactor);
      expect(call?.create.intervalDays).toBe(fc.schedule.intervalDays);
      expect(call?.create.repetitions).toBe(fc.schedule.repetitions);
      expect(call?.create.dueAt).toBe(fc.schedule.dueAt);
      expect(call?.update.easeFactor).toBe(fc.schedule.easeFactor);
      expect(call?.update.dueAt).toBe(fc.schedule.dueAt);
    });
  });

  describe('findById', () => {
    it('returns null when row is not found', async () => {
      vi.mocked(prisma.flashcard.findUnique).mockResolvedValue(null);
      expect(await repo.findById('fc-1')).toBeNull();
    });

    it('maps null sourceCueId to undefined on the aggregate', async () => {
      vi.mocked(prisma.flashcard.findUnique).mockResolvedValue(makeRow());
      const result = await repo.findById('fc-1');
      expect(result?.sourceCueId).toBeUndefined();
    });

    it('maps non-null sourceCueId to string on the aggregate', async () => {
      vi.mocked(prisma.flashcard.findUnique).mockResolvedValue(makeRow({ sourceCueId: 'cue-1' }));
      const result = await repo.findById('fc-1');
      expect(result?.sourceCueId).toBe('cue-1');
    });

    it('reconstitutes the review schedule from row columns', async () => {
      vi.mocked(prisma.flashcard.findUnique).mockResolvedValue(
        makeRow({ easeFactor: 2.7, intervalDays: 6, repetitions: 2 }),
      );
      const result = await repo.findById('fc-1');
      expect(result?.schedule).toEqual({
        easeFactor: 2.7,
        intervalDays: 6,
        repetitions: 2,
        dueAt: T0,
      });
    });
  });

  describe('findManyByUserAndLesson', () => {
    it('filters by userId and lessonId, orders by createdAt ASC', async () => {
      vi.mocked(prisma.flashcard.findMany).mockResolvedValue([]);
      await repo.findManyByUserAndLesson('user-42', 'lesson-99');

      const call = vi.mocked(prisma.flashcard.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ userId: 'user-42', lessonId: 'lesson-99' });
      expect(call?.orderBy).toEqual({ createdAt: 'asc' });
    });

    it('maps rows to aggregates', async () => {
      vi.mocked(prisma.flashcard.findMany).mockResolvedValue([makeRow({ id: 'fc-2' })]);
      const [fc] = await repo.findManyByUserAndLesson('user-1', 'lesson-1');
      expect(fc?.id).toBe('fc-2');
    });
  });

  describe('findDueByUser', () => {
    it('filters by userId and dueAt <= now, orders by dueAt ASC, applies limit', async () => {
      vi.mocked(prisma.flashcard.findMany).mockResolvedValue([]);
      const now = new Date('2026-03-01T00:00:00.000Z');
      await repo.findDueByUser('user-1', now, 20);

      const call = vi.mocked(prisma.flashcard.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ userId: 'user-1', dueAt: { lte: now } });
      expect(call?.orderBy).toEqual({ dueAt: 'asc' });
      expect(call?.take).toBe(20);
    });
  });

  describe('delete', () => {
    it('delegates to prisma.flashcard.delete with the correct id', async () => {
      await repo.delete('fc-1');
      expect(prisma.flashcard.delete).toHaveBeenCalledWith({ where: { id: 'fc-1' } });
    });
  });
});

/**
 * Unit tests for PrismaBookmarkRepository.
 * PrismaService is mocked at the delegate level — no real DB connection.
 * Covers:
 *   - save: upsert called with correct where/create/update payloads.
 *   - save: label undefined → null at the Prisma boundary.
 *   - save: label defined → passed through.
 *   - findById: null DB row → null return.
 *   - findById: label null in DB → aggregate.label undefined.
 *   - findById: label set in DB → aggregate.label string.
 *   - findManyByUserAndLesson: returns aggregates ordered by positionSeconds ASC.
 *   - delete: delegates to prisma.bookmark.delete.
 */
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Bookmark } from '../domain/bookmark/bookmark';
import { BookmarkIdempotencyConflictError } from '../domain/bookmark/bookmark.errors';
import { PrismaBookmarkRepository } from './prisma-bookmark.repository';

// ---------------------------------------------------------------------------
// Minimal PrismaService mock
// ---------------------------------------------------------------------------

interface BookmarkDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

function makePrisma(): { bookmark: BookmarkDelegate } {
  return {
    bookmark: {
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

function makeAggregate(label?: string, idempotencyKey?: string): Bookmark {
  return Bookmark.create({
    id: 'bm-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    positionSeconds: 30,
    ...(label === undefined ? {} : { label }),
    ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
  });
}

function makeRow(
  overrides: Partial<{
    id: string;
    userId: string;
    lessonId: string;
    positionSeconds: number;
    label: string | null;
    idempotencyKey: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'bm-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    positionSeconds: 30,
    label: null,
    idempotencyKey: null,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

function p2002(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: '7.0.0',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaBookmarkRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaBookmarkRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaBookmarkRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------

  describe('save', () => {
    it('calls bookmark.upsert with the correct where clause (id)', async () => {
      await repo.save(makeAggregate());

      expect(prisma.bookmark.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.bookmark.upsert).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ id: 'bm-1' });
    });

    it('maps label undefined to null in create/update payloads', async () => {
      await repo.save(makeAggregate()); // no label → undefined

      const call = vi.mocked(prisma.bookmark.upsert).mock.calls[0]?.[0];
      expect(call?.create.label).toBeNull();
      expect(call?.update.label).toBeNull();
    });

    it('passes label string through when defined', async () => {
      await repo.save(makeAggregate('my note'));

      const call = vi.mocked(prisma.bookmark.upsert).mock.calls[0]?.[0];
      expect(call?.create.label).toBe('my note');
      expect(call?.update.label).toBe('my note');
    });

    it('includes userId, lessonId, positionSeconds in create payload', async () => {
      await repo.save(makeAggregate());

      const call = vi.mocked(prisma.bookmark.upsert).mock.calls[0]?.[0];
      expect(call?.create.userId).toBe('user-1');
      expect(call?.create.lessonId).toBe('lesson-1');
      expect(call?.create.positionSeconds).toBe(30);
    });

    it('maps idempotencyKey undefined to null in the create payload (#285)', async () => {
      await repo.save(makeAggregate());

      const call = vi.mocked(prisma.bookmark.upsert).mock.calls[0]?.[0];
      expect(call?.create.idempotencyKey).toBeNull();
    });

    it('passes idempotencyKey through when defined, in create only (never re-set on update)', async () => {
      await repo.save(makeAggregate(undefined, 'retry-key-1'));

      const call = vi.mocked(prisma.bookmark.upsert).mock.calls[0]?.[0];
      expect(call?.create.idempotencyKey).toBe('retry-key-1');
      expect(call?.update).not.toHaveProperty('idempotencyKey');
    });

    it('translates P2002 to BookmarkIdempotencyConflictError', async () => {
      vi.mocked(prisma.bookmark.upsert).mockRejectedValue(p2002());
      await expect(repo.save(makeAggregate(undefined, 'retry-key-1'))).rejects.toBeInstanceOf(
        BookmarkIdempotencyConflictError,
      );
    });

    it('rethrows other Prisma errors unchanged', async () => {
      const other = new Prisma.PrismaClientKnownRequestError('Unknown', {
        code: 'P2025',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.bookmark.upsert).mockRejectedValue(other);
      await expect(repo.save(makeAggregate())).rejects.toBe(other);
    });
  });

  // -------------------------------------------------------------------------
  // findByIdempotencyKey
  // -------------------------------------------------------------------------

  describe('findByIdempotencyKey', () => {
    it('returns null when no row matches', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null);
      const result = await repo.findByIdempotencyKey('user-1', 'lesson-1', 'retry-key-1');
      expect(result).toBeNull();
    });

    it('looks up by the compound (userId, lessonId, idempotencyKey) unique', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null);
      await repo.findByIdempotencyKey('user-1', 'lesson-1', 'retry-key-1');

      const call = vi.mocked(prisma.bookmark.findUnique).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        uq_bookmark_idempotency: {
          userId: 'user-1',
          lessonId: 'lesson-1',
          idempotencyKey: 'retry-key-1',
        },
      });
    });

    it('reconstitutes the aggregate when a row matches', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(
        makeRow({ idempotencyKey: 'retry-key-1' }),
      );
      const result = await repo.findByIdempotencyKey('user-1', 'lesson-1', 'retry-key-1');
      expect(result?.id).toBe('bm-1');
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------

  describe('findById', () => {
    it('returns null when row is not found', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(null);
      expect(await repo.findById('bm-1')).toBeNull();
    });

    it('maps null label to undefined on the aggregate', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(makeRow());
      const result = await repo.findById('bm-1');
      expect(result?.label).toBeUndefined();
    });

    it('maps non-null label to string on the aggregate', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(makeRow({ label: 'chapter 1' }));
      const result = await repo.findById('bm-1');
      expect(result?.label).toBe('chapter 1');
    });

    it('reconstitutes positionSeconds from the row', async () => {
      vi.mocked(prisma.bookmark.findUnique).mockResolvedValue(makeRow({ positionSeconds: 120 }));
      const result = await repo.findById('bm-1');
      expect(result?.positionSeconds).toBe(120);
    });
  });

  // -------------------------------------------------------------------------
  // findManyByUserAndLesson
  // -------------------------------------------------------------------------

  describe('findManyByUserAndLesson', () => {
    it('returns empty array when no rows', async () => {
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      const result = await repo.findManyByUserAndLesson('user-1', 'lesson-1');
      expect(result).toEqual([]);
    });

    it('orders rows by positionSeconds ASC (verifies orderBy arg)', async () => {
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([
        makeRow({ id: 'bm-2', positionSeconds: 10 }),
        makeRow({ id: 'bm-1', positionSeconds: 30 }),
      ]);

      const result = await repo.findManyByUserAndLesson('user-1', 'lesson-1');

      // Confirm the orderBy arg was passed
      const call = vi.mocked(prisma.bookmark.findMany).mock.calls[0]?.[0];
      expect(call?.orderBy).toEqual({ positionSeconds: 'asc' });

      // The mock returns rows as-is (already "sorted" by our fixture);
      // verify mapping preserves order
      expect(result[0]?.positionSeconds).toBe(10);
      expect(result[1]?.positionSeconds).toBe(30);
    });

    it('maps label null → undefined on returned aggregates', async () => {
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([makeRow({ label: null })]);
      const [bm] = await repo.findManyByUserAndLesson('user-1', 'lesson-1');
      expect(bm?.label).toBeUndefined();
    });

    it('maps label string through on returned aggregates', async () => {
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([makeRow({ label: 'hello' })]);
      const [bm] = await repo.findManyByUserAndLesson('user-1', 'lesson-1');
      expect(bm?.label).toBe('hello');
    });

    it('filters by userId and lessonId', async () => {
      vi.mocked(prisma.bookmark.findMany).mockResolvedValue([]);
      await repo.findManyByUserAndLesson('user-42', 'lesson-99');

      const call = vi.mocked(prisma.bookmark.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ userId: 'user-42', lessonId: 'lesson-99' });
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('delegates to prisma.bookmark.delete with the correct id', async () => {
      await repo.delete('bm-1');
      expect(prisma.bookmark.delete).toHaveBeenCalledWith({ where: { id: 'bm-1' } });
    });
  });
});

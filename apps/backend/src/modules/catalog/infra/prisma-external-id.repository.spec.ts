/**
 * WHY this file exists:
 * Unit tests for PrismaExternalIdRepository. PrismaService is mocked so no real
 * DB connection is required. Tests cover:
 *   - replaceForEntity: deletes existing then inserts new refs.
 *   - replaceForEntity: with empty refs array clears existing rows.
 *   - replaceForEntity: accepts an optional tx (Prisma.TransactionClient) and
 *     uses it instead of the injected prisma instance.
 *   - replaceForEntity: P2002 → ExternalIdConflictError.
 *   - findByEntity: returns refs in createdAt order.
 *   - findByEntity: returns empty array when no rows.
 *   - findEntity: returns { entityType, entityId, url } when found.
 *   - findEntity: returns null when not found.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { ExternalIdConflictError } from '../domain/shared-vo/shared.errors';
import { PrismaExternalIdRepository } from './prisma-external-id.repository';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeExternalIdRow(
  overrides: Partial<{
    id: string;
    entityType: string;
    entityId: string;
    source: string;
    externalId: string;
    url: string | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: 'eid-1',
    entityType: 'instructor',
    entityId: 'inst-1',
    source: 'udemy',
    externalId: 'udemy-123',
    url: null,
    createdAt: NOW,
    ...overrides,
  };
}

interface ExternalIdDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  externalId: ExternalIdDelegate;
}

function makePrisma(): MockPrisma {
  return {
    externalId: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaExternalIdRepository', () => {
  let prisma: MockPrisma;
  let repo: PrismaExternalIdRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaExternalIdRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // replaceForEntity
  // -------------------------------------------------------------------------
  describe('replaceForEntity', () => {
    it('deletes existing rows then inserts new refs', async () => {
      const refs = [{ source: 'udemy', externalId: 'udemy-123' }];
      await repo.replaceForEntity('instructor', 'inst-1', refs);

      expect(prisma.externalId.deleteMany).toHaveBeenCalledWith({
        where: { entityType: 'instructor', entityId: 'inst-1' },
      });
      expect(prisma.externalId.createMany).toHaveBeenCalledOnce();
      const createCall = vi.mocked(prisma.externalId.createMany).mock.calls[0]?.[0];
      expect(createCall?.data).toHaveLength(1);
      expect(createCall?.data[0].source).toBe('udemy');
      expect(createCall?.data[0].externalId).toBe('udemy-123');
      expect(createCall?.data[0].url).toBeNull();
    });

    it('does not call createMany when refs array is empty', async () => {
      await repo.replaceForEntity('course', 'course-1', []);

      expect(prisma.externalId.deleteMany).toHaveBeenCalledOnce();
      expect(prisma.externalId.createMany).not.toHaveBeenCalled();
    });

    it('includes url when ref has a url', async () => {
      const refs = [{ source: 'udemy', externalId: 'udemy-123', url: 'https://udemy.com/123' }];
      await repo.replaceForEntity('instructor', 'inst-1', refs);

      const createCall = vi.mocked(prisma.externalId.createMany).mock.calls[0]?.[0];
      expect(createCall?.data[0].url).toBe('https://udemy.com/123');
    });

    it('uses provided tx client instead of the injected prisma', async () => {
      // The tx must behave like a Prisma transaction client.
      const tx = {
        externalId: {
          deleteMany: vi.fn().mockResolvedValue(undefined),
          createMany: vi.fn().mockResolvedValue(undefined),
        },
      };

      const refs = [{ source: 'coursera', externalId: 'cr-99' }];
      await repo.replaceForEntity('studio', 'studio-1', refs, tx);

      // Writes go to the tx client, NOT to the injected prisma.
      expect(tx.externalId.deleteMany).toHaveBeenCalledOnce();
      expect(tx.externalId.createMany).toHaveBeenCalledOnce();
      expect(prisma.externalId.deleteMany).not.toHaveBeenCalled();
      expect(prisma.externalId.createMany).not.toHaveBeenCalled();
    });

    it('throws ExternalIdConflictError on P2002', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.externalId.createMany).mockRejectedValue(p2002);

      const refs = [{ source: 'udemy', externalId: 'udemy-123' }];
      await expect(repo.replaceForEntity('instructor', 'inst-1', refs)).rejects.toBeInstanceOf(
        ExternalIdConflictError,
      );
    });

    it('propagates non-P2002 Prisma errors unchanged', async () => {
      const other = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.externalId.deleteMany).mockRejectedValue(other);

      await expect(repo.replaceForEntity('tag', 'tag-1', [])).rejects.toBeInstanceOf(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findByEntity
  // -------------------------------------------------------------------------
  describe('findByEntity', () => {
    it('returns empty array when no rows', async () => {
      vi.mocked(prisma.externalId.findMany).mockResolvedValue([]);
      const result = await repo.findByEntity('instructor', 'inst-1');
      expect(result).toEqual([]);
    });

    it('returns refs ordered by createdAt ascending', async () => {
      const rows = [
        makeExternalIdRow({
          source: 'udemy',
          externalId: 'udemy-1',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        makeExternalIdRow({
          source: 'coursera',
          externalId: 'cr-2',
          createdAt: new Date('2026-01-02T00:00:00.000Z'),
        }),
      ];
      vi.mocked(prisma.externalId.findMany).mockResolvedValue(rows);

      const result = await repo.findByEntity('instructor', 'inst-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.source).toBe('udemy');
      expect(result[1]!.source).toBe('coursera');
      // url absent when null
      expect(result[0]!.url).toBeUndefined();
    });

    it('includes url when row has a url', async () => {
      const rows = [makeExternalIdRow({ url: 'https://udemy.com/123' })];
      vi.mocked(prisma.externalId.findMany).mockResolvedValue(rows);

      const result = await repo.findByEntity('instructor', 'inst-1');

      expect(result[0]!.url).toBe('https://udemy.com/123');
    });

    it('queries with correct entityType and entityId', async () => {
      await repo.findByEntity('course', 'course-42');

      expect(prisma.externalId.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityType: 'course', entityId: 'course-42' },
        }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // findEntity
  // -------------------------------------------------------------------------
  describe('findEntity', () => {
    it('returns null when no row found', async () => {
      vi.mocked(prisma.externalId.findUnique).mockResolvedValue(null);
      const result = await repo.findEntity('udemy', 'missing-id');
      expect(result).toBeNull();
    });

    it('returns entityType + entityId + url when found', async () => {
      const row = makeExternalIdRow({
        entityType: 'course',
        entityId: 'course-7',
        source: 'udemy',
        externalId: 'udemy-7',
        url: 'https://udemy.com/7',
      });
      vi.mocked(prisma.externalId.findUnique).mockResolvedValue(row);

      const result = await repo.findEntity('udemy', 'udemy-7');

      expect(result).not.toBeNull();
      expect(result?.entityType).toBe('course');
      expect(result?.entityId).toBe('course-7');
      expect(result?.url).toBe('https://udemy.com/7');
    });

    it('uses the compound unique key name from the schema', async () => {
      await repo.findEntity('udemy', 'abc');

      const call = vi.mocked(prisma.externalId.findUnique).mock.calls[0]?.[0];
      // The schema declares @@unique([source, externalId], name: "uq_external_id_source_value")
      // Prisma uses that name as the compound key accessor.
      expect(call?.where).toHaveProperty('uq_external_id_source_value');
      expect(call?.where?.uq_external_id_source_value).toEqual({
        source: 'udemy',
        externalId: 'abc',
      });
    });

    it('returns url: null when row url is null', async () => {
      const row = makeExternalIdRow({ url: null });
      vi.mocked(prisma.externalId.findUnique).mockResolvedValue(row);

      const result = await repo.findEntity('udemy', 'udemy-123');

      expect(result?.url).toBeNull();
    });
  });
});

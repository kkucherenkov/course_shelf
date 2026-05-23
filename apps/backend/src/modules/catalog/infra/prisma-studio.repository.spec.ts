/**
 * WHY this file exists:
 * Unit tests for PrismaStudioRepository. PrismaService and
 * ExternalIdRepository are mocked so no real DB connection is required.
 * Tests mirror prisma-instructor.repository.spec.ts exactly — studios and
 * instructors share identical structural rules.
 * Tests cover:
 *   - save happy path: upserts studio row and delegates to externalIds.
 *   - P2002 on slug unique constraint → StudioSlugAlreadyTakenError.
 *   - Other Prisma errors propagate unchanged.
 *   - findById: returns null / reconstitutes aggregate.
 *   - findBySlug: returns null / reconstitutes aggregate.
 *   - findByExternalId: returns null when entityType mismatches.
 *   - findManyPaginated: with and without search.
 *   - count: with and without search.
 *   - findCoursesForStudio: returns courseIds + total ordered by title.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Studio } from '../domain/studio/studio';
import { StudioSlugAlreadyTakenError } from '../domain/studio/studio.errors';
import { PrismaStudioRepository } from './prisma-studio.repository';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeStudioRow(
  overrides: Partial<{
    id: string;
    slug: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'studio-1',
    slug: 'pixar',
    displayName: 'Pixar',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeStudio(
  overrides: Partial<{ id: string; displayName: string; slug: string }> = {},
): Studio {
  return Studio.create({
    id: overrides.id ?? 'studio-1',
    displayName: overrides.displayName ?? 'Pixar',
    slug: overrides.slug ?? 'pixar',
    now: NOW,
  });
}

interface StudioDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
}

interface CourseStudioDelegate {
  count: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

interface ExternalIdDelegate {
  findMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  studio: StudioDelegate;
  courseStudio: CourseStudioDelegate;
  externalId: ExternalIdDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    studio: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    courseStudio: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    externalId: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  };

  vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );

  return prisma;
}

function makeExternalIdRepo() {
  return {
    replaceForEntity: vi.fn().mockResolvedValue(undefined),
    findByEntity: vi.fn().mockResolvedValue([]),
    findEntity: vi.fn().mockResolvedValue(null),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaStudioRepository', () => {
  let prisma: MockPrisma;
  let externalIdRepo: ReturnType<typeof makeExternalIdRepo>;
  let repo: PrismaStudioRepository;

  beforeEach(() => {
    prisma = makePrisma();
    externalIdRepo = makeExternalIdRepo();
    repo = new PrismaStudioRepository(prisma as never, externalIdRepo as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  describe('save', () => {
    it('upserts studio row with all scalar fields', async () => {
      const studio = makeStudio();
      await repo.save(studio);

      expect(prisma.studio.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.studio.upsert).mock.calls[0]?.[0];
      expect(call?.create.id).toBe('studio-1');
      expect(call?.create.slug).toBe('pixar');
      expect(call?.create.displayName).toBe('Pixar');
      expect(call?.update.slug).toBe('pixar');
      expect(call?.update.displayName).toBe('Pixar');
    });

    it('delegates external id replacement to the ExternalIdRepository', async () => {
      const studio = makeStudio();
      studio.addExternalId({ source: 'imdb', externalId: 'nm-1' });
      await repo.save(studio);

      expect(externalIdRepo.replaceForEntity).toHaveBeenCalledOnce();
      const [entityType, entityId, refs] = vi.mocked(externalIdRepo.replaceForEntity).mock
        .calls[0]!;
      expect(entityType).toBe('studio');
      expect(entityId).toBe('studio-1');
      expect(refs).toHaveLength(1);
    });

    it('throws StudioSlugAlreadyTakenError on P2002', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(p2002);

      await expect(repo.save(makeStudio())).rejects.toBeInstanceOf(StudioSlugAlreadyTakenError);
    });

    it('propagates non-P2002 Prisma errors unchanged', async () => {
      const other = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(other);

      await expect(repo.save(makeStudio())).rejects.toBeInstanceOf(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('returns null when studio not found', async () => {
      vi.mocked(prisma.studio.findUnique).mockResolvedValue(null);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });

    it('reconstitutes aggregate with loaded external ids', async () => {
      const row = makeStudioRow();
      vi.mocked(prisma.studio.findUnique).mockResolvedValue(row);
      vi.mocked(externalIdRepo.findByEntity).mockResolvedValue([
        { source: 'imdb', externalId: 'nm-99' },
      ]);

      const result = await repo.findById('studio-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('studio-1');
      expect(result?.externalIds).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------
  describe('findBySlug', () => {
    it('returns null when slug not found', async () => {
      vi.mocked(prisma.studio.findUnique).mockResolvedValue(null);
      const result = await repo.findBySlug('unknown');
      expect(result).toBeNull();
    });

    it('reconstitutes aggregate when row found', async () => {
      vi.mocked(prisma.studio.findUnique).mockResolvedValue(makeStudioRow());
      const result = await repo.findBySlug('pixar');
      expect(result?.slug).toBe('pixar');
    });
  });

  // -------------------------------------------------------------------------
  // findByExternalId
  // -------------------------------------------------------------------------
  describe('findByExternalId', () => {
    it('returns null when entityType !== studio', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue({
        entityType: 'instructor',
        entityId: 'inst-1',
        url: null,
      });
      const result = await repo.findByExternalId('imdb', 'nm-1');
      expect(result).toBeNull();
    });

    it('returns the aggregate when entityType === studio', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue({
        entityType: 'studio',
        entityId: 'studio-1',
        url: null,
      });
      vi.mocked(prisma.studio.findUnique).mockResolvedValue(makeStudioRow());

      const result = await repo.findByExternalId('imdb', 'nm-1');
      expect(result?.id).toBe('studio-1');
    });
  });

  // -------------------------------------------------------------------------
  // findManyPaginated
  // -------------------------------------------------------------------------
  describe('findManyPaginated', () => {
    it('returns empty array when no studios exist', async () => {
      vi.mocked(prisma.studio.findMany).mockResolvedValue([]);
      const result = await repo.findManyPaginated({ offset: 0, limit: 10 });
      expect(result).toEqual([]);
    });

    it('queries with displayName contains when search is provided', async () => {
      vi.mocked(prisma.studio.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10, search: 'pixar' });

      const call = vi.mocked(prisma.studio.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        displayName: { contains: 'pixar', mode: 'insensitive' },
      });
    });

    it('applies skip and take from offset and limit', async () => {
      vi.mocked(prisma.studio.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 2, limit: 5 });

      const call = vi.mocked(prisma.studio.findMany).mock.calls[0]?.[0];
      expect(call?.skip).toBe(2);
      expect(call?.take).toBe(5);
    });
  });

  // -------------------------------------------------------------------------
  // count
  // -------------------------------------------------------------------------
  describe('count', () => {
    it('returns total count without filter', async () => {
      vi.mocked(prisma.studio.count).mockResolvedValue(7);
      const result = await repo.count();
      expect(result).toBe(7);
    });

    it('returns filtered count with search', async () => {
      vi.mocked(prisma.studio.count).mockResolvedValue(2);
      const result = await repo.count('pixar');
      expect(result).toBe(2);
      const call = vi.mocked(prisma.studio.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        displayName: { contains: 'pixar', mode: 'insensitive' },
      });
    });
  });

  // -------------------------------------------------------------------------
  // findCoursesForStudio
  // -------------------------------------------------------------------------
  describe('findCoursesForStudio', () => {
    it('returns courseIds and total', async () => {
      vi.mocked(prisma.courseStudio.count).mockResolvedValue(5);
      vi.mocked(prisma.courseStudio.findMany).mockResolvedValue([
        { courseId: 'c1', course: { title: 'Alpha' } },
        { courseId: 'c2', course: { title: 'Beta' } },
      ]);

      const result = await repo.findCoursesForStudio('studio-1', { offset: 0, limit: 2 });

      expect(result.total).toBe(5);
      expect(result.courseIds).toEqual(['c1', 'c2']);
    });

    it('queries with studioId filter', async () => {
      vi.mocked(prisma.courseStudio.count).mockResolvedValue(0);
      vi.mocked(prisma.courseStudio.findMany).mockResolvedValue([]);

      await repo.findCoursesForStudio('studio-99', { offset: 0, limit: 10 });

      const countCall = vi.mocked(prisma.courseStudio.count).mock.calls[0]?.[0];
      expect(countCall?.where).toEqual({ studioId: 'studio-99' });
    });
  });
});

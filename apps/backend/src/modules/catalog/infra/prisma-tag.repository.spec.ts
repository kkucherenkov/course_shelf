/**
 * WHY this file exists:
 * Unit tests for PrismaTagRepository. PrismaService and
 * ExternalIdRepository are mocked so no real DB connection is required.
 * Tests mirror prisma-instructor.repository.spec.ts with additions for the
 * tag-specific category field and category filter in findManyPaginated.
 * Tests cover:
 *   - save happy path: upserts tag row (including category) and delegates externalIds.
 *   - P2002 on slug unique constraint → TagSlugAlreadyTakenError.
 *   - Other Prisma errors propagate unchanged.
 *   - findById: returns null / reconstitutes aggregate with category.
 *   - findBySlug: returns null / reconstitutes aggregate.
 *   - findByExternalId: returns null when entityType mismatches.
 *   - findManyPaginated: no filters; search only; category only; both combined.
 *   - count: no opts; search; category; both.
 *   - findCoursesForTag: returns courseIds + total ordered by title.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Tag } from '../domain/tag/tag';
import { TagSlugAlreadyTakenError } from '../domain/tag/tag.errors';
import { PrismaTagRepository } from './prisma-tag.repository';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeTagRow(
  overrides: Partial<{
    id: string;
    slug: string;
    displayName: string;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'tag-1',
    slug: 'react',
    displayName: 'React',
    category: 'frontend',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeTag(
  overrides: Partial<{
    id: string;
    displayName: string;
    slug: string;
    category: string | null;
  }> = {},
): Tag {
  // Use 'category' in overrides check so that explicitly passing null works
  // (null ?? 'frontend' would silently fall back to 'frontend').
  const category = 'category' in overrides ? (overrides.category ?? null) : 'frontend';
  return Tag.create({
    id: overrides.id ?? 'tag-1',
    displayName: overrides.displayName ?? 'React',
    slug: overrides.slug ?? 'react',
    category,
    now: NOW,
  });
}

interface TagDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
}

interface CourseTagDelegate {
  count: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

interface ExternalIdDelegate {
  findMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  tag: TagDelegate;
  courseTag: CourseTagDelegate;
  externalId: ExternalIdDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    tag: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    courseTag: {
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

describe('PrismaTagRepository', () => {
  let prisma: MockPrisma;
  let externalIdRepo: ReturnType<typeof makeExternalIdRepo>;
  let repo: PrismaTagRepository;

  beforeEach(() => {
    prisma = makePrisma();
    externalIdRepo = makeExternalIdRepo();
    repo = new PrismaTagRepository(prisma as never, externalIdRepo as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  describe('save', () => {
    it('upserts tag row including category', async () => {
      const tag = makeTag();
      await repo.save(tag);

      expect(prisma.tag.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.tag.upsert).mock.calls[0]?.[0];
      expect(call?.create.id).toBe('tag-1');
      expect(call?.create.slug).toBe('react');
      expect(call?.create.displayName).toBe('React');
      expect(call?.create.category).toBe('frontend');
      expect(call?.update.category).toBe('frontend');
    });

    it('writes null category when tag has no category', async () => {
      const tag = makeTag({ category: null });
      await repo.save(tag);

      const call = vi.mocked(prisma.tag.upsert).mock.calls[0]?.[0];
      expect(call?.create.category).toBeNull();
    });

    it('delegates external id replacement to the ExternalIdRepository', async () => {
      const tag = makeTag();
      tag.addExternalId({ source: 'npm', externalId: 'react' });
      await repo.save(tag);

      expect(externalIdRepo.replaceForEntity).toHaveBeenCalledOnce();
      const [entityType, entityId, refs] = vi.mocked(externalIdRepo.replaceForEntity).mock
        .calls[0]!;
      expect(entityType).toBe('tag');
      expect(entityId).toBe('tag-1');
      expect(refs).toHaveLength(1);
    });

    it('throws TagSlugAlreadyTakenError on P2002', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(p2002);

      await expect(repo.save(makeTag())).rejects.toBeInstanceOf(TagSlugAlreadyTakenError);
    });

    it('propagates non-P2002 Prisma errors unchanged', async () => {
      const other = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(other);

      await expect(repo.save(makeTag())).rejects.toBeInstanceOf(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('returns null when tag not found', async () => {
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });

    it('reconstitutes aggregate including category', async () => {
      const row = makeTagRow({ category: 'backend' });
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(row);

      const result = await repo.findById('tag-1');

      expect(result).not.toBeNull();
      expect(result?.category).toBe('backend');
    });

    it('handles null category', async () => {
      const row = makeTagRow({ category: null });
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(row);

      const result = await repo.findById('tag-1');
      expect(result?.category).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------
  describe('findBySlug', () => {
    it('returns null when slug not found', async () => {
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(null);
      const result = await repo.findBySlug('unknown');
      expect(result).toBeNull();
    });

    it('reconstitutes aggregate when row found', async () => {
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(makeTagRow());
      const result = await repo.findBySlug('react');
      expect(result?.slug).toBe('react');
    });
  });

  // -------------------------------------------------------------------------
  // findByExternalId
  // -------------------------------------------------------------------------
  describe('findByExternalId', () => {
    it('returns null when entityType !== tag', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue({
        entityType: 'course',
        entityId: 'course-1',
        url: null,
      });
      const result = await repo.findByExternalId('npm', 'react');
      expect(result).toBeNull();
    });

    it('returns the aggregate when entityType === tag', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue({
        entityType: 'tag',
        entityId: 'tag-1',
        url: null,
      });
      vi.mocked(prisma.tag.findUnique).mockResolvedValue(makeTagRow());

      const result = await repo.findByExternalId('npm', 'react');
      expect(result?.id).toBe('tag-1');
    });
  });

  // -------------------------------------------------------------------------
  // findManyPaginated
  // -------------------------------------------------------------------------
  describe('findManyPaginated', () => {
    it('returns empty array when no tags exist', async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      const result = await repo.findManyPaginated({ offset: 0, limit: 10 });
      expect(result).toEqual([]);
    });

    it('queries without filters when no search or category given', async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10 });

      const call = vi.mocked(prisma.tag.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({});
    });

    it('queries with displayName contains when search is provided', async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10, search: 'react' });

      const call = vi.mocked(prisma.tag.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        AND: [{ displayName: { contains: 'react', mode: 'insensitive' } }],
      });
    });

    it('queries with category equals when category is provided', async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10, category: 'frontend' });

      const call = vi.mocked(prisma.tag.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        AND: [{ category: { equals: 'frontend', mode: 'insensitive' } }],
      });
    });

    it('combines search and category filters with AND', async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10, search: 'react', category: 'frontend' });

      const call = vi.mocked(prisma.tag.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        AND: [
          { displayName: { contains: 'react', mode: 'insensitive' } },
          { category: { equals: 'frontend', mode: 'insensitive' } },
        ],
      });
    });

    it('orders by category asc then displayName asc', async () => {
      vi.mocked(prisma.tag.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10 });

      const call = vi.mocked(prisma.tag.findMany).mock.calls[0]?.[0];
      expect(call?.orderBy).toEqual([{ category: 'asc' }, { displayName: 'asc' }]);
    });
  });

  // -------------------------------------------------------------------------
  // count
  // -------------------------------------------------------------------------
  describe('count', () => {
    it('returns total count with no opts', async () => {
      vi.mocked(prisma.tag.count).mockResolvedValue(15);
      const result = await repo.count();
      expect(result).toBe(15);
      const call = vi.mocked(prisma.tag.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({});
    });

    it('filters by search when provided', async () => {
      vi.mocked(prisma.tag.count).mockResolvedValue(3);
      await repo.count({ search: 'react' });
      const call = vi.mocked(prisma.tag.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        AND: [{ displayName: { contains: 'react', mode: 'insensitive' } }],
      });
    });

    it('filters by category when provided', async () => {
      vi.mocked(prisma.tag.count).mockResolvedValue(8);
      await repo.count({ category: 'frontend' });
      const call = vi.mocked(prisma.tag.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        AND: [{ category: { equals: 'frontend', mode: 'insensitive' } }],
      });
    });

    it('combines search and category filters', async () => {
      vi.mocked(prisma.tag.count).mockResolvedValue(2);
      await repo.count({ search: 'react', category: 'frontend' });
      const call = vi.mocked(prisma.tag.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        AND: [
          { displayName: { contains: 'react', mode: 'insensitive' } },
          { category: { equals: 'frontend', mode: 'insensitive' } },
        ],
      });
    });
  });

  // -------------------------------------------------------------------------
  // findCoursesForTag
  // -------------------------------------------------------------------------
  describe('findCoursesForTag', () => {
    it('returns courseIds and total', async () => {
      vi.mocked(prisma.courseTag.count).mockResolvedValue(4);
      vi.mocked(prisma.courseTag.findMany).mockResolvedValue([
        { courseId: 'c1', course: { title: 'Alpha' } },
        { courseId: 'c2', course: { title: 'Beta' } },
      ]);

      const result = await repo.findCoursesForTag('tag-1', { offset: 0, limit: 2 });

      expect(result.total).toBe(4);
      expect(result.courseIds).toEqual(['c1', 'c2']);
    });

    it('queries with tagId filter', async () => {
      vi.mocked(prisma.courseTag.count).mockResolvedValue(0);
      vi.mocked(prisma.courseTag.findMany).mockResolvedValue([]);

      await repo.findCoursesForTag('tag-99', { offset: 0, limit: 10 });

      const countCall = vi.mocked(prisma.courseTag.count).mock.calls[0]?.[0];
      expect(countCall?.where).toEqual({ tagId: 'tag-99' });
      const findCall = vi.mocked(prisma.courseTag.findMany).mock.calls[0]?.[0];
      expect(findCall?.where).toEqual({ tagId: 'tag-99' });
    });
  });
});

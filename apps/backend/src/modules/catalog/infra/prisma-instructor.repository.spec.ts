/**
 * WHY this file exists:
 * Unit tests for PrismaInstructorRepository. PrismaService and
 * ExternalIdRepository are mocked so no real DB connection is required.
 * Tests cover:
 *   - save happy path: upserts instructor row and delegates to externalIds.
 *   - save update: upserts existing row with changed fields.
 *   - P2002 on slug unique constraint → InstructorSlugAlreadyTakenError.
 *   - Other Prisma errors propagate unchanged.
 *   - findById: returns null for unknown id.
 *   - findById: reconstitutes aggregate with external ids.
 *   - findBySlug: returns null for unknown slug.
 *   - findBySlug: reconstitutes aggregate.
 *   - findByExternalId: returns null when entityType mismatches.
 *   - findByExternalId: returns aggregate when entityType === 'instructor'.
 *   - findManyPaginated: with and without search.
 *   - count: with and without search.
 *   - findCoursesForInstructor: returns ordered ids + total.
 *   - save round-trips externalIds via the ExternalIdRepository adapter.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Instructor } from '../domain/instructor/instructor';
import { InstructorSlugAlreadyTakenError } from '../domain/instructor/instructor.errors';
import { PrismaInstructorRepository } from './prisma-instructor.repository';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeInstructorRow(
  overrides: Partial<{
    id: string;
    slug: string;
    displayName: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: 'inst-1',
    slug: 'jane-smith',
    displayName: 'Jane Smith',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function makeInstructor(
  overrides: Partial<{ id: string; displayName: string; slug: string }> = {},
): Instructor {
  return Instructor.create({
    id: overrides.id ?? 'inst-1',
    displayName: overrides.displayName ?? 'Jane Smith',
    slug: overrides.slug ?? 'jane-smith',
    now: NOW,
  });
}

interface InstructorDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
}

interface CourseInstructorDelegate {
  count: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

interface ExternalIdDelegate {
  findMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  instructor: InstructorDelegate;
  courseInstructor: CourseInstructorDelegate;
  externalId: ExternalIdDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    instructor: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    courseInstructor: {
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

describe('PrismaInstructorRepository', () => {
  let prisma: MockPrisma;
  let externalIdRepo: ReturnType<typeof makeExternalIdRepo>;
  let repo: PrismaInstructorRepository;

  beforeEach(() => {
    prisma = makePrisma();
    externalIdRepo = makeExternalIdRepo();
    repo = new PrismaInstructorRepository(prisma as never, externalIdRepo as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  describe('save', () => {
    it('upserts instructor row with all scalar fields', async () => {
      const instructor = makeInstructor();
      await repo.save(instructor);

      expect(prisma.instructor.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.instructor.upsert).mock.calls[0]?.[0];
      expect(call?.create.id).toBe('inst-1');
      expect(call?.create.slug).toBe('jane-smith');
      expect(call?.create.displayName).toBe('Jane Smith');
      expect(call?.update.slug).toBe('jane-smith');
      expect(call?.update.displayName).toBe('Jane Smith');
    });

    it('delegates external id replacement to the ExternalIdRepository', async () => {
      const instructor = makeInstructor();
      instructor.addExternalId({ source: 'udemy', externalId: 'u-1' });
      await repo.save(instructor);

      expect(externalIdRepo.replaceForEntity).toHaveBeenCalledOnce();
      const [entityType, entityId, refs] = vi.mocked(externalIdRepo.replaceForEntity).mock
        .calls[0]!;
      expect(entityType).toBe('instructor');
      expect(entityId).toBe('inst-1');
      expect(refs).toHaveLength(1);
    });

    it('throws InstructorSlugAlreadyTakenError on P2002', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(p2002);

      await expect(repo.save(makeInstructor())).rejects.toBeInstanceOf(
        InstructorSlugAlreadyTakenError,
      );
    });

    it('propagates non-P2002 Prisma errors unchanged', async () => {
      const other = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: '7.0.0',
      });
      vi.mocked(prisma.$transaction).mockRejectedValue(other);

      await expect(repo.save(makeInstructor())).rejects.toBeInstanceOf(
        Prisma.PrismaClientKnownRequestError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  describe('findById', () => {
    it('returns null when instructor not found', async () => {
      vi.mocked(prisma.instructor.findUnique).mockResolvedValue(null);
      const result = await repo.findById('missing');
      expect(result).toBeNull();
    });

    it('reconstitutes aggregate with loaded external ids', async () => {
      const row = makeInstructorRow();
      vi.mocked(prisma.instructor.findUnique).mockResolvedValue(row);
      vi.mocked(externalIdRepo.findByEntity).mockResolvedValue([
        { source: 'udemy', externalId: 'u-42' },
      ]);

      const result = await repo.findById('inst-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('inst-1');
      expect(result?.slug).toBe('jane-smith');
      expect(result?.externalIds).toHaveLength(1);
      expect(result?.externalIds[0]!.source).toBe('udemy');
    });
  });

  // -------------------------------------------------------------------------
  // findBySlug
  // -------------------------------------------------------------------------
  describe('findBySlug', () => {
    it('returns null when slug not found', async () => {
      vi.mocked(prisma.instructor.findUnique).mockResolvedValue(null);
      const result = await repo.findBySlug('unknown-slug');
      expect(result).toBeNull();
    });

    it('reconstitutes aggregate when row found', async () => {
      const row = makeInstructorRow({ slug: 'jane-smith' });
      vi.mocked(prisma.instructor.findUnique).mockResolvedValue(row);

      const result = await repo.findBySlug('jane-smith');
      expect(result?.slug).toBe('jane-smith');
    });

    it('queries by slug', async () => {
      await repo.findBySlug('test-slug');
      const call = vi.mocked(prisma.instructor.findUnique).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ slug: 'test-slug' });
    });
  });

  // -------------------------------------------------------------------------
  // findByExternalId
  // -------------------------------------------------------------------------
  describe('findByExternalId', () => {
    it('returns null when no entity found for the (source, externalId) pair', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue(null);
      const result = await repo.findByExternalId('udemy', 'missing');
      expect(result).toBeNull();
    });

    it('returns null when entityType !== instructor', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue({
        entityType: 'course',
        entityId: 'course-1',
        url: null,
      });
      const result = await repo.findByExternalId('udemy', 'u-123');
      expect(result).toBeNull();
    });

    it('returns the aggregate when entityType === instructor', async () => {
      vi.mocked(externalIdRepo.findEntity).mockResolvedValue({
        entityType: 'instructor',
        entityId: 'inst-1',
        url: null,
      });
      const row = makeInstructorRow();
      vi.mocked(prisma.instructor.findUnique).mockResolvedValue(row);

      const result = await repo.findByExternalId('udemy', 'u-1');
      expect(result?.id).toBe('inst-1');
    });
  });

  // -------------------------------------------------------------------------
  // findManyPaginated
  // -------------------------------------------------------------------------
  describe('findManyPaginated', () => {
    it('returns empty array when no instructors exist', async () => {
      vi.mocked(prisma.instructor.findMany).mockResolvedValue([]);
      const result = await repo.findManyPaginated({ offset: 0, limit: 10 });
      expect(result).toEqual([]);
    });

    it('queries without search when search is undefined', async () => {
      vi.mocked(prisma.instructor.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10 });

      const call = vi.mocked(prisma.instructor.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({});
    });

    it('queries with displayName contains when search is provided', async () => {
      vi.mocked(prisma.instructor.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 0, limit: 10, search: 'jane' });

      const call = vi.mocked(prisma.instructor.findMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        displayName: { contains: 'jane', mode: 'insensitive' },
      });
    });

    it('applies skip and take from offset and limit', async () => {
      vi.mocked(prisma.instructor.findMany).mockResolvedValue([]);
      await repo.findManyPaginated({ offset: 5, limit: 3 });

      const call = vi.mocked(prisma.instructor.findMany).mock.calls[0]?.[0];
      expect(call?.skip).toBe(5);
      expect(call?.take).toBe(3);
    });

    it('batch-loads external ids and injects them into aggregates', async () => {
      const rows = [
        makeInstructorRow({ id: 'inst-1' }),
        makeInstructorRow({ id: 'inst-2', slug: 'bob' }),
      ];
      vi.mocked(prisma.instructor.findMany).mockResolvedValue(rows);
      vi.mocked(prisma.externalId.findMany).mockResolvedValue([
        {
          entityId: 'inst-1',
          entityType: 'instructor',
          source: 'udemy',
          externalId: 'u-1',
          url: null,
          id: 'e1',
          createdAt: NOW,
        },
      ]);

      const result = await repo.findManyPaginated({ offset: 0, limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0]!.externalIds).toHaveLength(1);
      expect(result[1]!.externalIds).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // count
  // -------------------------------------------------------------------------
  describe('count', () => {
    it('returns total count without filter', async () => {
      vi.mocked(prisma.instructor.count).mockResolvedValue(42);
      const result = await repo.count();
      expect(result).toBe(42);
      const call = vi.mocked(prisma.instructor.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({});
    });

    it('returns filtered count with search', async () => {
      vi.mocked(prisma.instructor.count).mockResolvedValue(5);
      const result = await repo.count('jane');
      expect(result).toBe(5);
      const call = vi.mocked(prisma.instructor.count).mock.calls[0]?.[0];
      expect(call?.where).toEqual({
        displayName: { contains: 'jane', mode: 'insensitive' },
      });
    });
  });

  // -------------------------------------------------------------------------
  // findCoursesForInstructor
  // -------------------------------------------------------------------------
  describe('findCoursesForInstructor', () => {
    it('returns courseIds and total', async () => {
      vi.mocked(prisma.courseInstructor.count).mockResolvedValue(3);
      vi.mocked(prisma.courseInstructor.findMany).mockResolvedValue([
        { courseId: 'c1', position: 0, course: { title: 'Alpha' } },
        { courseId: 'c2', position: 1, course: { title: 'Beta' } },
      ]);

      const result = await repo.findCoursesForInstructor('inst-1', { offset: 0, limit: 2 });

      expect(result.total).toBe(3);
      expect(result.courseIds).toEqual(['c1', 'c2']);
    });

    it('queries with instructorId filter', async () => {
      vi.mocked(prisma.courseInstructor.count).mockResolvedValue(0);
      vi.mocked(prisma.courseInstructor.findMany).mockResolvedValue([]);

      await repo.findCoursesForInstructor('inst-99', { offset: 0, limit: 10 });

      const countCall = vi.mocked(prisma.courseInstructor.count).mock.calls[0]?.[0];
      expect(countCall?.where).toEqual({ instructorId: 'inst-99' });
      const findCall = vi.mocked(prisma.courseInstructor.findMany).mock.calls[0]?.[0];
      expect(findCall?.where).toEqual({ instructorId: 'inst-99' });
    });
  });
});

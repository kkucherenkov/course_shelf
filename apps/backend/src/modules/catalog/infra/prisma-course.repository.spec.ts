/**
 * WHY this file exists:
 * Unit tests for PrismaCourseRepository. PrismaService is mocked so no real DB
 * connection is required. Tests cover:
 *   - save → findById roundtrip.
 *   - P2002 on (libraryId, slug) → CourseSlugAlreadyTakenError.
 *   - Other Prisma errors propagate unchanged.
 *   - findById returns null for unknown id.
 *   - findManyByLibrary returns aggregates with sections.
 *   - findAll returns all aggregates.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Course } from '../domain/course/course';
import { CourseSlugAlreadyTakenError } from '../domain/course/course.errors';
import { PrismaCourseRepository } from './prisma-course.repository';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function makeCourseRow(
  overrides: Partial<{
    id: string;
    libraryId: string;
    slug: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    sections: { id: string; courseId: string; position: number; title: string }[];
  }> = {},
) {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    description: null,
    createdAt: now,
    updatedAt: now,
    sections: [],
    ...overrides,
  };
}

interface CourseDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
}

interface SectionDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  course: CourseDelegate;
  section: SectionDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    course: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    section: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    $transaction: vi.fn(),
  };

  // Default $transaction implementation: run the callback with prisma itself.
  vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );

  return prisma;
}

function makeCourse(): Course {
  return Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaCourseRepository', () => {
  let prisma: MockPrisma;
  let repo: PrismaCourseRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaCourseRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  it('calls prisma.course.upsert with aggregate fields', async () => {
    const course = makeCourse();
    await repo.save(course);

    expect(prisma.course.upsert).toHaveBeenCalledOnce();
    const call = vi.mocked(prisma.course.upsert).mock.calls[0]?.[0];
    expect(call?.create.id).toBe('course-1');
    expect(call?.create.slug).toBe('my-course');
    expect(call?.create.title).toBe('My Course');
  });

  it('deletes and recreates sections inside transaction', async () => {
    const course = makeCourse();
    course.addSection({ id: 's1', title: 'Intro' });
    await repo.save(course);

    expect(prisma.section.deleteMany).toHaveBeenCalledWith({ where: { courseId: 'course-1' } });
    expect(prisma.section.createMany).toHaveBeenCalledOnce();
  });

  it('throws CourseSlugAlreadyTakenError on P2002', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '7.0.0',
    });
    // Make the transaction itself reject with the P2002 error.
    vi.mocked(prisma.$transaction).mockRejectedValue(p2002);

    const course = makeCourse();
    await expect(repo.save(course)).rejects.toBeInstanceOf(CourseSlugAlreadyTakenError);
  });

  it('propagates other Prisma errors unchanged', async () => {
    const other = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.$transaction).mockRejectedValue(other);

    const course = makeCourse();
    await expect(repo.save(course)).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  it('returns null when row is not found', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue(null);
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('reconstitutes aggregate from row', async () => {
    const row = makeCourseRow({
      sections: [{ id: 's1', courseId: 'course-1', position: 1, title: 'Intro' }],
    });
    vi.mocked(prisma.course.findUnique).mockResolvedValue(row);

    const result = await repo.findById('course-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('course-1');
    expect(result?.slug).toBe('my-course');
    expect(result?.sections).toHaveLength(1);
    expect(result?.sections[0]!.title).toBe('Intro');
  });

  // -------------------------------------------------------------------------
  // roundtrip
  // -------------------------------------------------------------------------
  it('roundtrip: save then findById returns equal-by-fields aggregate', async () => {
    const course = makeCourse();
    const row = makeCourseRow({
      id: course.id,
      slug: course.slug,
      title: course.title,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });

    vi.mocked(prisma.course.findUnique).mockResolvedValue(row);

    await repo.save(course);
    const loaded = await repo.findById(course.id);

    expect(loaded?.id).toBe(course.id);
    expect(loaded?.slug).toBe(course.slug);
    expect(loaded?.title).toBe(course.title);
  });

  // -------------------------------------------------------------------------
  // findManyByLibrary
  // -------------------------------------------------------------------------
  it('returns courses for the given library', async () => {
    const rows = [
      makeCourseRow({ id: 'c1', slug: 'course-a', title: 'A' }),
      makeCourseRow({ id: 'c2', slug: 'course-b', title: 'B' }),
    ];
    vi.mocked(prisma.course.findMany).mockResolvedValue(rows);

    const result = await repo.findManyByLibrary('lib-1');

    expect(result).toHaveLength(2);
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { libraryId: 'lib-1' } }),
    );
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------
  it('returns all courses', async () => {
    const rows = [makeCourseRow({ id: 'c1', slug: 'course-a', title: 'A' })];
    vi.mocked(prisma.course.findMany).mockResolvedValue(rows);

    const result = await repo.findAll();

    expect(result).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // findRecentlyAdded
  // -------------------------------------------------------------------------
  describe('findRecentlyAdded', () => {
    it('returns empty array when no courses exist', async () => {
      vi.mocked(prisma.course.findMany).mockResolvedValue([]);

      const result = await repo.findRecentlyAdded(5);
      expect(result).toEqual([]);
    });

    it('queries with orderBy createdAt desc and take limit * 3', async () => {
      vi.mocked(prisma.course.findMany).mockResolvedValue([]);

      await repo.findRecentlyAdded(5);

      const call = vi.mocked(prisma.course.findMany).mock.calls[0]?.[0];
      expect(call?.orderBy).toEqual({ createdAt: 'desc' });
      expect(call?.take).toBe(15);
    });

    it('reconstitutes aggregates from returned rows', async () => {
      const rows = [
        makeCourseRow({ id: 'c1', slug: 'course-a', title: 'A' }),
        makeCourseRow({ id: 'c2', slug: 'course-b', title: 'B' }),
      ];
      vi.mocked(prisma.course.findMany).mockResolvedValue(rows);

      const result = await repo.findRecentlyAdded(2);
      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('c1');
      expect(result[1]?.id).toBe('c2');
    });
  });
});

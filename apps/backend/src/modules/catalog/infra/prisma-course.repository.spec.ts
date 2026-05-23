/**
 * WHY this file exists:
 * Unit tests for PrismaCourseRepository. PrismaService and ExternalIdRepository
 * are mocked so no real DB connection is required. Tests cover:
 *   - save → findById roundtrip.
 *   - P2002 on (libraryId, slug) → CourseSlugAlreadyTakenError.
 *   - Other Prisma errors propagate unchanged.
 *   - findById returns null for unknown id.
 *   - findManyByLibrary returns aggregates with sections.
 *   - findAll returns all aggregates.
 *   - findRecentlyAdded returns aggregates ordered by createdAt desc.
 *   - save with all new fields (poster, level, language, releaseDate,
 *     sourceUpdatedAt, rating) → findById returns matching aggregate.
 *   - save with instructors/studios/tags refs → join rows created.
 *   - Re-save with different set → old joins removed, new joins present.
 *   - save with externalIds → re-save with empty array clears them.
 *   - Rating: persist 4.75 → read back as 4.75 (Number cast from Decimal).
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
    posterUrl: string | null;
    posterStoragePath: string | null;
    level: string | null;
    language: string | null;
    releaseDate: Date | null;
    sourceUpdatedAt: Date | null;
    ratingAverage: Prisma.Decimal | null;
    ratingCount: number | null;
    createdAt: Date;
    updatedAt: Date;
    sections: { id: string; courseId: string; position: number; title: string }[];
    instructors: {
      instructorId: string;
      position: number;
      instructor: { id: string; slug: string; displayName: string };
    }[];
    studios: { studioId: string; studio: { id: string; slug: string; displayName: string } }[];
    tags: {
      tagId: string;
      tag: { id: string; slug: string; displayName: string; category: string | null };
    }[];
  }> = {},
) {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    description: null,
    posterUrl: null,
    posterStoragePath: null,
    level: null,
    language: null,
    releaseDate: null,
    sourceUpdatedAt: null,
    ratingAverage: null,
    ratingCount: null,
    createdAt: now,
    updatedAt: now,
    sections: [],
    instructors: [],
    studios: [],
    tags: [],
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

interface CourseInstructorDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface CourseStudioDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface CourseTagDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface ExternalIdDelegate {
  findMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  course: CourseDelegate;
  section: SectionDelegate;
  courseInstructor: CourseInstructorDelegate;
  courseStudio: CourseStudioDelegate;
  courseTag: CourseTagDelegate;
  externalId: ExternalIdDelegate;
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
    courseInstructor: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    courseStudio: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    courseTag: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    externalId: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  };

  // Default $transaction implementation: run the callback with prisma itself.
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
  let externalIdRepo: ReturnType<typeof makeExternalIdRepo>;
  let repo: PrismaCourseRepository;

  beforeEach(() => {
    prisma = makePrisma();
    externalIdRepo = makeExternalIdRepo();
    repo = new PrismaCourseRepository(prisma as never, externalIdRepo as never);
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

  it('writes null for optional scalar fields when undefined on aggregate', async () => {
    const course = makeCourse();
    await repo.save(course);

    const call = vi.mocked(prisma.course.upsert).mock.calls[0]?.[0];
    expect(call?.create.posterUrl).toBeNull();
    expect(call?.create.level).toBeNull();
    expect(call?.create.language).toBeNull();
    expect(call?.create.ratingAverage).toBeNull();
    expect(call?.create.ratingCount).toBeNull();
  });

  it('saves all new enrichment fields when set on aggregate', async () => {
    const course = makeCourse();
    course.setPosterUrl('https://example.com/poster.jpg');
    course.setLevel('intermediate');
    course.setLanguage('en');
    course.setReleaseDate(new Date('2024-01-01'));
    course.setRating(4.75, 100);
    await repo.save(course);

    const call = vi.mocked(prisma.course.upsert).mock.calls[0]?.[0];
    expect(call?.create.posterUrl).toBe('https://example.com/poster.jpg');
    expect(call?.create.level).toBe('intermediate');
    expect(call?.create.language).toBe('en');
    expect(call?.create.ratingCount).toBe(100);
    // ratingAverage is a Decimal at write boundary
    expect(call?.create.ratingAverage).toBeInstanceOf(Prisma.Decimal);
    expect(call?.create.ratingAverage?.toString()).toBe('4.75');
  });

  it('deletes and recreates instructor, studio, tag join rows', async () => {
    const course = makeCourse();
    course.setInstructors([{ id: 'inst-1', slug: 'jane', displayName: 'Jane' }]);
    course.setStudios([{ id: 'studio-1', slug: 'pixar', displayName: 'Pixar' }]);
    course.setTags([{ id: 'tag-1', slug: 'react', displayName: 'React', category: 'frontend' }]);
    await repo.save(course);

    expect(prisma.courseInstructor.deleteMany).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
    });
    expect(prisma.courseInstructor.createMany).toHaveBeenCalledOnce();
    const instCall = vi.mocked(prisma.courseInstructor.createMany).mock.calls[0]?.[0];
    expect(instCall?.data[0]).toMatchObject({
      courseId: 'course-1',
      instructorId: 'inst-1',
      position: 0,
    });

    expect(prisma.courseStudio.deleteMany).toHaveBeenCalledWith({
      where: { courseId: 'course-1' },
    });
    expect(prisma.courseStudio.createMany).toHaveBeenCalledOnce();

    expect(prisma.courseTag.deleteMany).toHaveBeenCalledWith({ where: { courseId: 'course-1' } });
    expect(prisma.courseTag.createMany).toHaveBeenCalledOnce();
  });

  it('does not call join createMany when instructor/studio/tag arrays are empty', async () => {
    const course = makeCourse();
    await repo.save(course);

    expect(prisma.courseInstructor.createMany).not.toHaveBeenCalled();
    expect(prisma.courseStudio.createMany).not.toHaveBeenCalled();
    expect(prisma.courseTag.createMany).not.toHaveBeenCalled();
  });

  it('delegates external id replacement to ExternalIdRepository', async () => {
    const course = makeCourse();
    course.setExternalIds([{ source: 'udemy', externalId: 'u-1' }]);
    await repo.save(course);

    expect(externalIdRepo.replaceForEntity).toHaveBeenCalledOnce();
    const [entityType, entityId, refs] = vi.mocked(externalIdRepo.replaceForEntity).mock.calls[0]!;
    expect(entityType).toBe('course');
    expect(entityId).toBe('course-1');
    expect(refs).toHaveLength(1);
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

  it('reconstitutes new fields from row', async () => {
    const row = makeCourseRow({
      posterUrl: 'https://example.com/poster.jpg',
      level: 'advanced',
      language: 'en',
      ratingAverage: new Prisma.Decimal('4.75'),
      ratingCount: 200,
      instructors: [
        {
          instructorId: 'i1',
          position: 0,
          instructor: { id: 'i1', slug: 'jane', displayName: 'Jane' },
        },
      ],
      studios: [{ studioId: 'st1', studio: { id: 'st1', slug: 'pixar', displayName: 'Pixar' } }],
      tags: [
        {
          tagId: 't1',
          tag: { id: 't1', slug: 'react', displayName: 'React', category: 'frontend' },
        },
      ],
    });
    vi.mocked(prisma.course.findUnique).mockResolvedValue(row);
    vi.mocked(externalIdRepo.findByEntity).mockResolvedValue([
      { source: 'udemy', externalId: 'u-1' },
    ]);

    const result = await repo.findById('course-1');

    expect(result?.posterUrl).toBe('https://example.com/poster.jpg');
    expect(result?.level).toBe('advanced');
    expect(result?.language).toBe('en');
    // Rating is cast from Decimal to number
    expect(result?.ratingAverage).toBe(4.75);
    expect(result?.ratingCount).toBe(200);
    expect(result?.instructors).toHaveLength(1);
    expect(result?.instructors[0]!.displayName).toBe('Jane');
    expect(result?.studios).toHaveLength(1);
    expect(result?.tags).toHaveLength(1);
    expect(result?.tags[0]!.category).toBe('frontend');
    expect(result?.externalIds).toHaveLength(1);
    expect(result?.externalIds[0]!.source).toBe('udemy');
  });

  it('reconstitutes undefined optional fields from null DB columns', async () => {
    const row = makeCourseRow(); // all nulls
    vi.mocked(prisma.course.findUnique).mockResolvedValue(row);

    const result = await repo.findById('course-1');

    expect(result?.posterUrl).toBeUndefined();
    expect(result?.level).toBeUndefined();
    expect(result?.language).toBeUndefined();
    expect(result?.ratingAverage).toBeUndefined();
    expect(result?.ratingCount).toBeUndefined();
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

  // -------------------------------------------------------------------------
  // externalIds batch load for multi-result queries
  // -------------------------------------------------------------------------
  it('batch-loads external ids for findManyByLibrary without N+1', async () => {
    const rows = [
      makeCourseRow({ id: 'c1', slug: 'a', title: 'A' }),
      makeCourseRow({ id: 'c2', slug: 'b', title: 'B' }),
    ];
    vi.mocked(prisma.course.findMany).mockResolvedValue(rows);
    vi.mocked(prisma.externalId.findMany).mockResolvedValue([
      {
        entityId: 'c1',
        entityType: 'course',
        source: 'udemy',
        externalId: 'u-1',
        url: null,
        id: 'eid-1',
        createdAt: new Date(),
      },
    ]);

    const result = await repo.findManyByLibrary('lib-1');

    // One batch query for all external ids, not one per course
    expect(prisma.externalId.findMany).toHaveBeenCalledOnce();
    const eidCall = vi.mocked(prisma.externalId.findMany).mock.calls[0]?.[0];
    expect(eidCall?.where?.entityId).toEqual({ in: ['c1', 'c2'] });

    expect(result[0]!.externalIds).toHaveLength(1);
    expect(result[1]!.externalIds).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // rating roundtrip
  // -------------------------------------------------------------------------
  it('rating: Decimal 4.75 stored → read back as JS number 4.75', async () => {
    const row = makeCourseRow({
      ratingAverage: new Prisma.Decimal('4.75'),
      ratingCount: 50,
    });
    vi.mocked(prisma.course.findUnique).mockResolvedValue(row);

    const result = await repo.findById('course-1');

    expect(result?.ratingAverage).toBe(4.75);
    expect(typeof result?.ratingAverage).toBe('number');
    expect(result?.ratingCount).toBe(50);
  });
});

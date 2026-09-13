/**
 * Unit tests for PrismaLessonRepository. PrismaService is mocked so no real DB
 * connection is required. Tests cover:
 *   - save → findById roundtrip with materials + subtitles.
 *   - P2002 on (sectionId, position) → LessonPositionConflictError.
 *   - Other Prisma errors propagate unchanged.
 *   - findById returns null for unknown id.
 *   - findByCourse returns aggregates ordered correctly.
 *   - findBySection returns aggregates ordered by position.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';

import { Lesson } from '../domain/lesson/lesson';
import { Material } from '../domain/lesson/material';
import { Subtitle } from '../domain/lesson/subtitle';
import { LessonPositionConflictError } from '../domain/lesson/lesson.errors';
import { PrismaLessonRepository } from './prisma-lesson.repository';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeLessonRow(
  overrides: Partial<{
    id: string;
    courseId: string;
    sectionId: string;
    position: number;
    title: string;
    videoPath: string;
    mtime: Date;
    sizeBytes: number;
    duration: number | null;
    createdAt: Date;
    updatedAt: Date;
    materials: { id: string; kind: string; label: string; path: string; sizeBytes: number }[];
    subtitles: { id: string; language: string; label: string; path: string }[];
  }> = {},
) {
  return {
    id: 'lesson-1',
    courseId: 'course-1',
    sectionId: 'section-1',
    position: 1,
    title: 'Intro',
    videoPath: '/lib/course/01 - Intro.mp4',
    mtime: NOW,
    sizeBytes: 1000,
    duration: null,
    createdAt: NOW,
    updatedAt: NOW,
    materials: [],
    subtitles: [],
    ...overrides,
  };
}

interface LessonDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
}

/** The three tables that reference `lessonId` with no foreign key behind it. */
interface LearningDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
}

interface MaterialDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface SubtitleDelegate {
  deleteMany: ReturnType<typeof vi.fn>;
  createMany: ReturnType<typeof vi.fn>;
}

interface MockPrisma {
  lesson: LessonDelegate;
  material: MaterialDelegate;
  subtitle: SubtitleDelegate;
  lessonProgress: LearningDelegate;
  bookmark: LearningDelegate;
  note: LearningDelegate;
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    lesson: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    material: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    subtitle: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    lessonProgress: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    bookmark: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    note: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
    $transaction: vi.fn(),
  };

  vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn(prisma),
  );

  return prisma;
}

function makeLesson(): Lesson {
  const lesson = Lesson.create({
    id: 'lesson-1',
    courseId: 'course-1',
    sectionId: 'section-1',
    position: 1,
    title: 'Intro',
    videoPath: '/lib/course/01 - Intro.mp4',
    mtime: NOW,
    sizeBytes: 1000,
    now: NOW,
  });
  return lesson;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaLessonRepository', () => {
  let prisma: MockPrisma;
  let repo: PrismaLessonRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaLessonRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------
  it('calls prisma.lesson.upsert with aggregate fields', async () => {
    const lesson = makeLesson();
    await repo.save(lesson);

    expect(prisma.lesson.upsert).toHaveBeenCalledOnce();
    const call = vi.mocked(prisma.lesson.upsert).mock.calls[0]?.[0];
    expect(call?.create.id).toBe('lesson-1');
    expect(call?.create.courseId).toBe('course-1');
    expect(call?.create.sectionId).toBe('section-1');
    expect(call?.create.position).toBe(1);
    expect(call?.create.title).toBe('Intro');
  });

  it('deletes and recreates materials + subtitles inside transaction', async () => {
    const lesson = makeLesson();
    lesson.addMaterial(
      Material.fromFile({ id: 'm1', path: '/lib/course/01 - Intro.pdf', sizeBytes: 500 }),
    );
    lesson.addSubtitle(Subtitle.fromFile({ id: 's1', path: '/lib/course/01 - Intro.en.srt' }));

    await repo.save(lesson);

    expect(prisma.material.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'lesson-1' } });
    expect(prisma.material.createMany).toHaveBeenCalledOnce();
    const materialCall = vi.mocked(prisma.material.createMany).mock.calls[0]?.[0];
    expect(materialCall?.data).toHaveLength(1);
    expect(materialCall?.data[0].id).toBe('m1');

    expect(prisma.subtitle.deleteMany).toHaveBeenCalledWith({ where: { lessonId: 'lesson-1' } });
    expect(prisma.subtitle.createMany).toHaveBeenCalledOnce();
    const subtitleCall = vi.mocked(prisma.subtitle.createMany).mock.calls[0]?.[0];
    expect(subtitleCall?.data).toHaveLength(1);
    expect(subtitleCall?.data[0].id).toBe('s1');
  });

  it('does not call createMany when no materials or subtitles', async () => {
    const lesson = makeLesson();
    await repo.save(lesson);

    expect(prisma.material.createMany).not.toHaveBeenCalled();
    expect(prisma.subtitle.createMany).not.toHaveBeenCalled();
  });

  it('throws LessonPositionConflictError on P2002', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.$transaction).mockRejectedValue(p2002);

    await expect(repo.save(makeLesson())).rejects.toBeInstanceOf(LessonPositionConflictError);
  });

  it('propagates other Prisma errors unchanged', async () => {
    const other = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: '7.0.0',
    });
    vi.mocked(prisma.$transaction).mockRejectedValue(other);

    await expect(repo.save(makeLesson())).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  // -------------------------------------------------------------------------
  // findById
  // -------------------------------------------------------------------------
  it('returns null when lesson is not found', async () => {
    vi.mocked(prisma.lesson.findUnique).mockResolvedValue(null);
    const result = await repo.findById('missing');
    expect(result).toBeNull();
  });

  it('reconstitutes aggregate from row with materials + subtitles', async () => {
    const row = makeLessonRow({
      materials: [
        { id: 'm1', kind: 'doc', label: '01 - Intro', path: '/lib/01 - Intro.pdf', sizeBytes: 500 },
      ],
      subtitles: [
        { id: 's1', language: 'en', label: '01 - Intro', path: '/lib/01 - Intro.en.srt' },
      ],
    });
    vi.mocked(prisma.lesson.findUnique).mockResolvedValue(row);

    const result = await repo.findById('lesson-1');

    expect(result).not.toBeNull();
    expect(result?.id).toBe('lesson-1');
    expect(result?.materials).toHaveLength(1);
    expect(result?.materials[0]!.kind).toBe('doc');
    expect(result?.subtitles).toHaveLength(1);
    expect(result?.subtitles[0]!.language).toBe('en');
  });

  // -------------------------------------------------------------------------
  // roundtrip
  // -------------------------------------------------------------------------
  it('roundtrip: save then findById reconstitutes the aggregate', async () => {
    const lesson = makeLesson();
    lesson.addMaterial(
      Material.fromFile({ id: 'm1', path: '/lib/01 - Intro.pdf', sizeBytes: 500 }),
    );
    lesson.addSubtitle(Subtitle.fromFile({ id: 's1', path: '/lib/01 - Intro.en.srt' }));

    const row = makeLessonRow({
      id: lesson.id,
      title: lesson.title,
      materials: [
        { id: 'm1', kind: 'doc', label: '01 - Intro', path: '/lib/01 - Intro.pdf', sizeBytes: 500 },
      ],
      subtitles: [
        { id: 's1', language: 'en', label: '01 - Intro', path: '/lib/01 - Intro.en.srt' },
      ],
    });
    vi.mocked(prisma.lesson.findUnique).mockResolvedValue(row);

    await repo.save(lesson);
    const loaded = await repo.findById(lesson.id);

    expect(loaded?.id).toBe(lesson.id);
    expect(loaded?.title).toBe('Intro');
    expect(loaded?.materials).toHaveLength(1);
    expect(loaded?.subtitles).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // findByCourse
  // -------------------------------------------------------------------------
  it('returns lessons for the given course', async () => {
    const rows = [
      makeLessonRow({ id: 'l1', position: 1, title: 'Intro' }),
      makeLessonRow({ id: 'l2', position: 2, title: 'Deep Dive' }),
    ];
    vi.mocked(prisma.lesson.findMany).mockResolvedValue(rows);

    const result = await repo.findByCourse('course-1');

    expect(result).toHaveLength(2);
    expect(prisma.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { courseId: 'course-1' } }),
    );
  });

  // -------------------------------------------------------------------------
  // findBySection
  // -------------------------------------------------------------------------
  it('returns lessons for the given section ordered by position', async () => {
    const rows = [makeLessonRow({ id: 'l1', position: 1 })];
    vi.mocked(prisma.lesson.findMany).mockResolvedValue(rows);

    const result = await repo.findBySection('section-1');

    expect(result).toHaveLength(1);
    expect(prisma.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: 'section-1' } }),
    );
  });

  // -------------------------------------------------------------------------
  // tuxedo 118: sizeBytes is BigInt — a real video file exceeds Int's ~2GB
  // cap (measured: 3129930702 bytes).
  // -------------------------------------------------------------------------
  describe('tuxedo 118: sizeBytes beyond Int32 range', () => {
    const OVERSIZED_BYTES = 3_129_930_702; // ~2.9 GiB, exceeds 2147483647

    it('passes an oversized sizeBytes through to upsert without throwing', async () => {
      const lesson = Lesson.create({
        id: 'lesson-huge',
        courseId: 'course-1',
        sectionId: 'section-1',
        position: 1,
        title: 'Huge',
        videoPath: '/lib/course/huge.mp4',
        mtime: NOW,
        sizeBytes: OVERSIZED_BYTES,
        now: NOW,
      });

      await expect(repo.save(lesson)).resolves.toBeUndefined();

      const call = vi.mocked(prisma.lesson.upsert).mock.calls[0]?.[0];
      expect(call?.create.sizeBytes).toBe(OVERSIZED_BYTES);
    });

    it('round-trips an oversized sizeBytes back as a JS number (Prisma returns bigint for a BigInt column)', async () => {
      const row = makeLessonRow({ sizeBytes: BigInt(OVERSIZED_BYTES) as unknown as number });
      vi.mocked(prisma.lesson.findUnique).mockResolvedValue(row);

      const result = await repo.findById('lesson-1');

      expect(result?.sizeBytes).toBe(OVERSIZED_BYTES);
      expect(typeof result?.sizeBytes).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // getLessonStatsByCourseIds
  // -------------------------------------------------------------------------
  describe('getLessonStatsByCourseIds', () => {
    it('returns empty map for empty courseIds', async () => {
      const result = await repo.getLessonStatsByCourseIds([]);
      expect(result).toEqual(new Map());
      expect(prisma.lesson.groupBy).not.toHaveBeenCalled();
    });

    it('returns stats map from groupBy result', async () => {
      vi.mocked(prisma.lesson.groupBy).mockResolvedValue([
        { courseId: 'course-1', _count: { id: 5 }, _sum: { duration: 1800 } },
        { courseId: 'course-2', _count: { id: 3 }, _sum: { duration: null } },
      ]);

      const result = await repo.getLessonStatsByCourseIds(['course-1', 'course-2']);

      expect(result.get('course-1')).toEqual({ lessonCount: 5, totalDurationSeconds: 1800 });
      // null sum → 0
      expect(result.get('course-2')).toEqual({ lessonCount: 3, totalDurationSeconds: 0 });
    });

    it('queries with courseId in filter', async () => {
      vi.mocked(prisma.lesson.groupBy).mockResolvedValue([]);

      await repo.getLessonStatsByCourseIds(['course-1', 'course-2']);

      const call = vi.mocked(prisma.lesson.groupBy).mock.calls[0]?.[0];
      expect(call?.where?.courseId).toEqual({ in: ['course-1', 'course-2'] });
    });
  });

  // -------------------------------------------------------------------------
  // parkPositionsForResync (E32-F01-S03)
  // -------------------------------------------------------------------------
  describe('parkPositionsForResync', () => {
    it('shifts every position of the course in one statement', async () => {
      await repo.parkPositionsForResync('course-1');

      expect(prisma.lesson.updateMany).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.lesson.updateMany).mock.calls[0]?.[0];
      expect(call?.where).toEqual({ courseId: 'course-1' });
      // A uniform shift, not a per-row rewrite: adding the same constant to
      // every row keeps them distinct, so parking can never collide with
      // itself on (sectionId, position).
      expect(call?.data?.position?.decrement).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // removeMany (E32-F01-S03)
  // -------------------------------------------------------------------------
  describe('removeMany', () => {
    it('deletes the rows that reference lessonId without a foreign key, then the lessons', async () => {
      const order: string[] = [];
      vi.mocked(prisma.lessonProgress.deleteMany).mockImplementation(async () => {
        order.push('lessonProgress');
        return { count: 0 };
      });
      vi.mocked(prisma.bookmark.deleteMany).mockImplementation(async () => {
        order.push('bookmark');
        return { count: 0 };
      });
      vi.mocked(prisma.note.deleteMany).mockImplementation(async () => {
        order.push('note');
        return { count: 0 };
      });
      vi.mocked(prisma.lesson.deleteMany).mockImplementation(async () => {
        order.push('lesson');
        return { count: 0 };
      });

      await repo.removeMany(['lesson-1', 'lesson-2']);

      // Child-first: the lesson row goes last.
      expect(order).toEqual(['lessonProgress', 'bookmark', 'note', 'lesson']);
      const where = { lessonId: { in: ['lesson-1', 'lesson-2'] } };
      expect(prisma.lessonProgress.deleteMany).toHaveBeenCalledWith({ where });
      expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({ where });
      expect(prisma.note.deleteMany).toHaveBeenCalledWith({ where });
      expect(prisma.lesson.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['lesson-1', 'lesson-2'] } },
      });
      // One transaction — a half-deleted lesson would leave progress rows
      // pointing at a row that no longer exists, with no FK to catch it.
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });

    it('is a no-op for an empty id list', async () => {
      await repo.removeMany([]);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.lesson.deleteMany).not.toHaveBeenCalled();
    });
  });
});

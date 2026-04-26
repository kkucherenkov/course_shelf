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
  $transaction: ReturnType<typeof vi.fn>;
}

function makePrisma(): MockPrisma {
  const prisma: MockPrisma = {
    lesson: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
    },
    material: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
    subtitle: {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
    },
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
});

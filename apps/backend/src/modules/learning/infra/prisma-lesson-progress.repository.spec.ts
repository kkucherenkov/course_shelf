/**
 * Unit tests for PrismaLessonProgressRepository.
 * PrismaService is mocked at the delegate level — no real DB connection.
 * Covers:
 *   - save: upsert called with the correct where/create/update payload.
 *   - save: completedAt undefined → null at the Prisma boundary.
 *   - findByUserAndLesson: null DB row → null return.
 *   - findByUserAndLesson: row with completedAt null → aggregate.completedAt undefined.
 *   - findByUserAndLesson: row with completedAt set → aggregate.completedAt is Date.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LessonProgress } from '../domain/progress/lesson-progress';
import { PrismaLessonProgressRepository } from './prisma-lesson-progress.repository';

// ---------------------------------------------------------------------------
// Minimal PrismaService mock
// ---------------------------------------------------------------------------

interface LessonProgressDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
}

function makePrisma(): {
  lessonProgress: LessonProgressDelegate;
  $queryRaw: ReturnType<typeof vi.fn>;
} {
  return {
    lessonProgress: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const T0 = new Date('2026-01-01T00:00:00.000Z');
const T1 = new Date('2026-01-01T01:00:00.000Z');

function makeAggregate(completed = false): LessonProgress {
  const { aggregate } = LessonProgress.start({
    id: 'lp-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    durationSeconds: 100,
    positionSeconds: completed ? 95 : 50,
    clientUpdatedAt: T0,
  });
  return aggregate;
}

function makeRow(
  overrides: Partial<{
    id: string;
    userId: string;
    lessonId: string;
    positionSeconds: number;
    durationSeconds: number;
    percent: number;
    completed: boolean;
    lastSeenAt: Date;
    completedAt: Date | null;
    createdAt: Date;
  }> = {},
) {
  return {
    id: 'lp-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    positionSeconds: 50,
    durationSeconds: 100,
    percent: 50,
    completed: false,
    lastSeenAt: T0,
    completedAt: null,
    createdAt: T0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaLessonProgressRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaLessonProgressRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaLessonProgressRepository(prisma as never);
  });

  // -------------------------------------------------------------------------
  // save
  // -------------------------------------------------------------------------

  it('calls lessonProgress.upsert with the correct where clause', async () => {
    const aggregate = makeAggregate();
    await repo.save(aggregate);

    expect(prisma.lessonProgress.upsert).toHaveBeenCalledOnce();
    const call = vi.mocked(prisma.lessonProgress.upsert).mock.calls[0]?.[0];
    expect(call?.where).toEqual({
      uq_lesson_progress_user_lesson: { userId: 'user-1', lessonId: 'lesson-1' },
    });
  });

  it('maps completedAt undefined to null in the create/update payloads', async () => {
    const aggregate = makeAggregate(false); // completed=false → completedAt undefined
    await repo.save(aggregate);

    const call = vi.mocked(prisma.lessonProgress.upsert).mock.calls[0]?.[0];
    expect(call?.create.completedAt).toBeNull();
    expect(call?.update.completedAt).toBeNull();
  });

  it('passes completedAt as Date when aggregate is completed', async () => {
    const aggregate = makeAggregate(true); // completed=true → completedAt=T0
    await repo.save(aggregate);

    const call = vi.mocked(prisma.lessonProgress.upsert).mock.calls[0]?.[0];
    expect(call?.create.completedAt).toEqual(T0);
    expect(call?.update.completedAt).toEqual(T0);
  });

  // -------------------------------------------------------------------------
  // findByUserAndLesson
  // -------------------------------------------------------------------------

  it('returns null when row is not found', async () => {
    vi.mocked(prisma.lessonProgress.findUnique).mockResolvedValue(null);
    const result = await repo.findByUserAndLesson('user-1', 'lesson-1');
    expect(result).toBeNull();
  });

  it('maps null completedAt to undefined on the aggregate', async () => {
    vi.mocked(prisma.lessonProgress.findUnique).mockResolvedValue(makeRow());
    const result = await repo.findByUserAndLesson('user-1', 'lesson-1');

    expect(result).not.toBeNull();
    expect(result!.completedAt).toBeUndefined();
  });

  it('maps non-null completedAt to a Date on the aggregate', async () => {
    vi.mocked(prisma.lessonProgress.findUnique).mockResolvedValue(
      makeRow({ completedAt: T1, completed: true, positionSeconds: 95, percent: 95 }),
    );
    const result = await repo.findByUserAndLesson('user-1', 'lesson-1');

    expect(result).not.toBeNull();
    expect(result!.completedAt).toEqual(T1);
    expect(result!.completed).toBe(true);
  });

  it('reconstitutes positionSeconds and percent from the row', async () => {
    vi.mocked(prisma.lessonProgress.findUnique).mockResolvedValue(
      makeRow({ positionSeconds: 70, percent: 70 }),
    );
    const result = await repo.findByUserAndLesson('user-1', 'lesson-1');

    expect(result!.positionSeconds).toBe(70);
    expect(result!.percent).toBe(70);
  });

  // -------------------------------------------------------------------------
  // aggregateForUserRange
  // -------------------------------------------------------------------------

  describe('aggregateForUserRange', () => {
    const FROM = new Date('2026-04-21T00:00:00.000Z');
    const TO = new Date('2026-04-28T00:00:00.000Z');

    it('returns zeros when $queryRaw returns empty array', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const result = await repo.aggregateForUserRange('user-1', FROM, TO);

      expect(result.minutesWatched).toBe(0);
      expect(result.lessonsCompleted).toBe(0);
    });

    it('computes minutesWatched by flooring totalPositionSeconds / 60', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { total_position: 3700n, completed_count: 0n },
      ]);

      const result = await repo.aggregateForUserRange('user-1', FROM, TO);

      // 3700 / 60 = 61.66... → floor → 61
      expect(result.minutesWatched).toBe(61);
    });

    it('maps completed_count to lessonsCompleted', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ total_position: 0n, completed_count: 4n }]);

      const result = await repo.aggregateForUserRange('user-1', FROM, TO);

      expect(result.lessonsCompleted).toBe(4);
    });

    it('handles null row gracefully (all zeros)', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { total_position: null, completed_count: null },
      ]);

      const result = await repo.aggregateForUserRange('user-1', FROM, TO);

      expect(result.minutesWatched).toBe(0);
      expect(result.lessonsCompleted).toBe(0);
    });
  });
});

/**
 * Unit tests for PrismaCourseProgressReadModelRepository.
 * PrismaService is mocked — no real DB required.
 *
 * Covers:
 *   - upsert() calls prisma with correct create/update fields.
 *   - findByUserAndCourse() returns null when no row, reconstitutes when found.
 *   - findManyByUser() returns rows sorted by lastSeenAt DESC (adapter enforces order).
 *   - findManyByCourseIdsForUser() filters by userId + courseId in.
 *   - deleteAll() calls prisma.courseProgressReadModel.deleteMany.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CourseProgressReadModel } from '../domain/progress/course-progress-read-model';
import { PrismaCourseProgressReadModelRepository } from './prisma-course-progress-read-model.repository';

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');

function makeRow(
  overrides: Partial<{
    id: string;
    userId: string;
    courseId: string;
    lessonsCompleted: number;
    lessonsTotal: number;
    percent: number;
    lastSeenAt: Date;
    lastSeenLessonId: string;
  }> = {},
) {
  return {
    id: 'cprm-1',
    userId: 'user-1',
    courseId: 'course-1',
    lessonsCompleted: 3,
    lessonsTotal: 10,
    percent: 30,
    lastSeenAt: NOW,
    lastSeenLessonId: 'lesson-3',
    ...overrides,
  };
}

function makeModel(overrides: Partial<Parameters<typeof CourseProgressReadModel.create>[0]> = {}) {
  return CourseProgressReadModel.create({
    id: 'cprm-1',
    userId: 'user-1',
    courseId: 'course-1',
    lessonsCompleted: 3,
    lessonsTotal: 10,
    percent: 30,
    lastSeenAt: NOW,
    lastSeenLessonId: 'lesson-3',
    ...overrides,
  });
}

interface CourseProgressDelegate {
  upsert: ReturnType<typeof vi.fn>;
  findUnique: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
}

function makePrisma(): { courseProgressReadModel: CourseProgressDelegate } {
  return {
    courseProgressReadModel: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

describe('PrismaCourseProgressReadModelRepository', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let repo: PrismaCourseProgressReadModelRepository;

  beforeEach(() => {
    prisma = makePrisma();
    repo = new PrismaCourseProgressReadModelRepository(prisma as never);
  });

  // ---------------------------------------------------------------------------
  // upsert
  // ---------------------------------------------------------------------------
  describe('upsert', () => {
    it('calls prisma.courseProgressReadModel.upsert with correct create fields', async () => {
      const model = makeModel();
      await repo.upsert(model);

      expect(prisma.courseProgressReadModel.upsert).toHaveBeenCalledOnce();
      const call = vi.mocked(prisma.courseProgressReadModel.upsert).mock.calls[0]?.[0];
      expect(call?.create.id).toBe(model.id);
      expect(call?.create.userId).toBe(model.userId);
      expect(call?.create.courseId).toBe(model.courseId);
      expect(call?.create.lessonsCompleted).toBe(3);
      expect(call?.create.lessonsTotal).toBe(10);
      expect(call?.create.percent).toBe(30);
      expect(call?.create.lastSeenAt).toEqual(NOW);
      expect(call?.create.lastSeenLessonId).toBe('lesson-3');
    });

    it('update fields match create fields (idempotent)', async () => {
      const model = makeModel();
      await repo.upsert(model);

      const call = vi.mocked(prisma.courseProgressReadModel.upsert).mock.calls[0]?.[0];
      expect(call?.update.lessonsCompleted).toBe(3);
      expect(call?.update.percent).toBe(30);
      expect(call?.update.lastSeenLessonId).toBe('lesson-3');
    });
  });

  // ---------------------------------------------------------------------------
  // findByUserAndCourse
  // ---------------------------------------------------------------------------
  describe('findByUserAndCourse', () => {
    it('returns null when no row found', async () => {
      vi.mocked(prisma.courseProgressReadModel.findUnique).mockResolvedValue(null);

      const result = await repo.findByUserAndCourse('user-1', 'course-1');
      expect(result).toBeNull();
    });

    it('reconstitutes the model from the row', async () => {
      vi.mocked(prisma.courseProgressReadModel.findUnique).mockResolvedValue(makeRow());

      const result = await repo.findByUserAndCourse('user-1', 'course-1');
      expect(result).not.toBeNull();
      expect(result?.courseId).toBe('course-1');
      expect(result?.percent).toBe(30);
      expect(result?.lastSeenLessonId).toBe('lesson-3');
    });
  });

  // ---------------------------------------------------------------------------
  // findManyByUser
  // ---------------------------------------------------------------------------
  describe('findManyByUser', () => {
    it('returns empty array when no rows', async () => {
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue([]);

      const result = await repo.findManyByUser('user-1');
      expect(result).toEqual([]);
    });

    it('returns rows in the order the adapter provides (last seen DESC)', async () => {
      const rows = [
        makeRow({ id: 'cprm-2', courseId: 'course-2', lastSeenAt: NOW }),
        makeRow({ id: 'cprm-1', courseId: 'course-1', lastSeenAt: EARLIER }),
      ];
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue(rows);

      const result = await repo.findManyByUser('user-1');
      expect(result).toHaveLength(2);
      expect(result[0]?.courseId).toBe('course-2');
      expect(result[1]?.courseId).toBe('course-1');
    });

    it('passes orderBy lastSeenAt desc to prisma', async () => {
      await repo.findManyByUser('user-1');

      const call = vi.mocked(prisma.courseProgressReadModel.findMany).mock.calls[0]?.[0];
      expect(call?.orderBy).toEqual({ lastSeenAt: 'desc' });
    });
  });

  // ---------------------------------------------------------------------------
  // findManyByCourseIdsForUser
  // ---------------------------------------------------------------------------
  describe('findManyByCourseIdsForUser', () => {
    it('returns empty array for empty courseIds', async () => {
      const result = await repo.findManyByCourseIdsForUser('user-1', []);
      expect(result).toEqual([]);
      expect(prisma.courseProgressReadModel.findMany).not.toHaveBeenCalled();
    });

    it('queries with userId + courseId in filter', async () => {
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue([makeRow()]);

      const result = await repo.findManyByCourseIdsForUser('user-1', ['course-1', 'course-2']);
      expect(result).toHaveLength(1);

      const call = vi.mocked(prisma.courseProgressReadModel.findMany).mock.calls[0]?.[0];
      expect(call?.where?.userId).toBe('user-1');
      expect(call?.where?.courseId).toEqual({ in: ['course-1', 'course-2'] });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteAll
  // ---------------------------------------------------------------------------
  describe('deleteAll', () => {
    it('calls prisma.courseProgressReadModel.deleteMany', async () => {
      await repo.deleteAll();

      expect(prisma.courseProgressReadModel.deleteMany).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // findCompletedByUser
  // ---------------------------------------------------------------------------
  describe('findCompletedByUser', () => {
    it('returns empty array when no rows found', async () => {
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue([]);

      const result = await repo.findCompletedByUser('user-1', 5);
      expect(result).toEqual([]);
    });

    it('filters rows where lessonsCompleted !== lessonsTotal', async () => {
      const rows = [
        makeRow({ id: 'cprm-1', courseId: 'course-1', lessonsCompleted: 5, lessonsTotal: 5 }),
        makeRow({ id: 'cprm-2', courseId: 'course-2', lessonsCompleted: 3, lessonsTotal: 5 }),
      ];
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue(rows);

      const result = await repo.findCompletedByUser('user-1', 5);
      expect(result).toHaveLength(1);
      expect(result[0]?.courseId).toBe('course-1');
    });

    it('slices to the requested limit after in-process filter', async () => {
      // All three are completed — limit=2 should return only two.
      const rows = [
        makeRow({
          id: 'cprm-1',
          courseId: 'course-1',
          lessonsCompleted: 5,
          lessonsTotal: 5,
          lastSeenAt: NOW,
        }),
        makeRow({
          id: 'cprm-2',
          courseId: 'course-2',
          lessonsCompleted: 5,
          lessonsTotal: 5,
          lastSeenAt: EARLIER,
        }),
        makeRow({
          id: 'cprm-3',
          courseId: 'course-3',
          lessonsCompleted: 5,
          lessonsTotal: 5,
          lastSeenAt: EARLIER,
        }),
      ];
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue(rows);

      const result = await repo.findCompletedByUser('user-1', 2);
      expect(result).toHaveLength(2);
    });

    it('queries with lessonsTotal gt 0 and orderBy lastSeenAt desc', async () => {
      vi.mocked(prisma.courseProgressReadModel.findMany).mockResolvedValue([]);

      await repo.findCompletedByUser('user-1', 5);

      const call = vi.mocked(prisma.courseProgressReadModel.findMany).mock.calls[0]?.[0];
      expect(call?.where?.userId).toBe('user-1');
      expect(call?.where?.lessonsTotal).toEqual({ gt: 0 });
      expect(call?.orderBy).toEqual({ lastSeenAt: 'desc' });
    });
  });
});

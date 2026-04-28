/**
 * Unit tests for LessonProgressRecordedHandler.
 *
 * Key scenarios:
 *   - New row: creates a read-model row when none exists.
 *   - Stale event: skips upsert when recordedAt <= existing.lastSeenAt.
 *   - Fresh event: bumps lastSeenAt + lastSeenLessonId.
 *   - Idempotency: duplicate event after a row exists with the same timestamp
 *     skips the upsert.
 */
import { describe, expect, it, vi } from 'vitest';

import { LessonProgressRecorded } from '../../../../common/learning-events';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { LessonProgressRecordedHandler } from './lesson-progress-recorded.handler';

import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');
const LATER = new Date('2026-04-27T10:00:00.000Z');

function makeLessonRepo(count = 5): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi
      .fn()
      .mockResolvedValue(
        Array.from({ length: count }, (_, i) => ({ id: `lesson-${String(i + 1)}` })),
      ),
    findBySection: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
  };
}

function makeProgressRepo(completedCount = 0): LessonProgressRepository {
  return {
    save: vi.fn(),
    findByUserAndLesson: vi.fn(),
    countCompletedByUserAndCourse: vi.fn().mockResolvedValue(completedCount),
    findAllUserCoursePairs: vi.fn(),
    findLatestByUserAndCourse: vi.fn(),
    aggregateForUserRange: vi.fn(),
  };
}

function makeReadModelRepo(
  existing: CourseProgressReadModel | null = null,
): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    findByUserAndCourse: vi.fn().mockResolvedValue(existing),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
  };
}

function makeHandler(opts: {
  lessonCount?: number;
  completedCount?: number;
  existing?: CourseProgressReadModel | null;
}) {
  const lessonRepo = makeLessonRepo(opts.lessonCount ?? 5);
  const progressRepo = makeProgressRepo(opts.completedCount ?? 0);
  const readModelRepo = makeReadModelRepo(opts.existing ?? null);
  const handler = new LessonProgressRecordedHandler(lessonRepo, progressRepo, readModelRepo);
  return { handler, readModelRepo };
}

function makeEvent(
  overrides: Partial<{
    userId: string;
    lessonId: string;
    courseId: string;
    positionSeconds: number;
    recordedAt: Date;
  }> = {},
): LessonProgressRecorded {
  return new LessonProgressRecorded(
    overrides.userId ?? 'user-1',
    overrides.lessonId ?? 'lesson-2',
    overrides.courseId ?? 'course-1',
    overrides.positionSeconds ?? 45,
    overrides.recordedAt ?? NOW,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LessonProgressRecordedHandler', () => {
  describe('no existing row', () => {
    it('creates a new row when none exists', async () => {
      const { handler, readModelRepo } = makeHandler({ existing: null });
      await handler.handle(makeEvent({ recordedAt: NOW, lessonId: 'lesson-2' }));

      expect(readModelRepo.upsert).toHaveBeenCalledOnce();
      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.userId).toBe('user-1');
      expect(model.courseId).toBe('course-1');
      expect(model.lastSeenAt).toEqual(NOW);
      expect(model.lastSeenLessonId).toBe('lesson-2');
    });
  });

  describe('stale event', () => {
    it('skips upsert when recordedAt <= existing.lastSeenAt', async () => {
      const existing = CourseProgressReadModel.create({
        id: 'cprm-1',
        userId: 'user-1',
        courseId: 'course-1',
        lessonsCompleted: 0,
        lessonsTotal: 5,
        percent: 0,
        lastSeenAt: NOW,
        lastSeenLessonId: 'lesson-2',
      });
      const { handler, readModelRepo } = makeHandler({ existing });
      await handler.handle(makeEvent({ recordedAt: EARLIER }));

      expect(readModelRepo.upsert).not.toHaveBeenCalled();
    });

    it('skips upsert when recordedAt equals existing.lastSeenAt', async () => {
      const existing = CourseProgressReadModel.create({
        id: 'cprm-1',
        userId: 'user-1',
        courseId: 'course-1',
        lessonsCompleted: 0,
        lessonsTotal: 5,
        percent: 0,
        lastSeenAt: NOW,
        lastSeenLessonId: 'lesson-2',
      });
      const { handler, readModelRepo } = makeHandler({ existing });
      await handler.handle(makeEvent({ recordedAt: NOW }));

      expect(readModelRepo.upsert).not.toHaveBeenCalled();
    });
  });

  describe('fresh event', () => {
    it('bumps lastSeenAt when event is newer', async () => {
      const existing = CourseProgressReadModel.create({
        id: 'cprm-1',
        userId: 'user-1',
        courseId: 'course-1',
        lessonsCompleted: 0,
        lessonsTotal: 5,
        percent: 0,
        lastSeenAt: EARLIER,
        lastSeenLessonId: 'lesson-1',
      });
      const { handler, readModelRepo } = makeHandler({ existing });
      await handler.handle(makeEvent({ recordedAt: LATER, lessonId: 'lesson-3' }));

      expect(readModelRepo.upsert).toHaveBeenCalledOnce();
      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.lastSeenAt).toEqual(LATER);
      expect(model.lastSeenLessonId).toBe('lesson-3');
    });
  });

  describe('completed count preservation', () => {
    it('preserves lessonsCompleted from the progress repo (not always 0)', async () => {
      const { handler, readModelRepo } = makeHandler({
        existing: null,
        completedCount: 3,
        lessonCount: 5,
      });
      await handler.handle(makeEvent());

      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.lessonsCompleted).toBe(3);
      expect(model.percent).toBe(60); // round(3/5 * 100)
    });
  });
});

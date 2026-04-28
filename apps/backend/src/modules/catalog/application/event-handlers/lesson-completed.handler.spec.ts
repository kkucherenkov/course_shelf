/**
 * Unit tests for LessonCompletedHandler.
 *
 * Idempotency: running the same event twice produces the same final upsert call.
 * The aggregate-level guard prevents duplicate LessonCompleted events from the
 * same user/lesson, but the handler itself is safe regardless.
 */
import { describe, expect, it, vi } from 'vitest';

import { LessonCompleted } from '../../../../common/learning-events';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { LessonCompletedHandler } from './lesson-completed.handler';

import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');

function makeLesson(id: string) {
  return { id, courseId: 'course-1' } as never;
}

function makeLessonRepo(count = 5): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi
      .fn()
      .mockResolvedValue(
        Array.from({ length: count }, (_, i) => makeLesson(`lesson-${String(i + 1)}`)),
      ),
    findBySection: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
  };
}

function makeProgressRepo(completedCount = 2): LessonProgressRepository {
  return {
    save: vi.fn(),
    findByUserAndLesson: vi.fn(),
    countCompletedByUserAndCourse: vi.fn().mockResolvedValue(completedCount),
    findAllUserCoursePairs: vi.fn(),
    findLatestByUserAndCourse: vi.fn(),
    aggregateForUserRange: vi.fn(),
    findManyByUserAndLessons: vi.fn(),
    bulkUpsertCompleted: vi.fn(),
    deleteAllByUserAndCourse: vi.fn(),
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
    deleteByUserAndCourse: vi.fn(),
  };
}

function makeHandler(
  opts: {
    lessonCount?: number;
    completedCount?: number;
    existing?: CourseProgressReadModel | null;
  } = {},
) {
  const lessonRepo = makeLessonRepo(opts.lessonCount ?? 5);
  const progressRepo = makeProgressRepo(opts.completedCount ?? 2);
  const readModelRepo = makeReadModelRepo(opts.existing ?? null);
  const handler = new LessonCompletedHandler(lessonRepo, progressRepo, readModelRepo);
  return { handler, lessonRepo, progressRepo, readModelRepo };
}

function makeEvent(
  overrides: Partial<{
    userId: string;
    lessonId: string;
    courseId: string;
    completedAt: Date;
  }> = {},
): LessonCompleted {
  return new LessonCompleted(
    overrides.userId ?? 'user-1',
    overrides.lessonId ?? 'lesson-3',
    overrides.courseId ?? 'course-1',
    overrides.completedAt ?? NOW,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LessonCompletedHandler', () => {
  describe('upserts with correct totals', () => {
    it('computes percent and upserts the read model', async () => {
      const { handler, readModelRepo } = makeHandler({ lessonCount: 5, completedCount: 2 });
      await handler.handle(makeEvent());

      expect(readModelRepo.upsert).toHaveBeenCalledOnce();
      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.lessonsCompleted).toBe(2);
      expect(model.lessonsTotal).toBe(5);
      expect(model.percent).toBe(40); // round(2/5 * 100) = 40
    });

    it('sets lastSeenAt and lastSeenLessonId from event when no existing row', async () => {
      const { handler, readModelRepo } = makeHandler({ existing: null });
      await handler.handle(makeEvent({ completedAt: NOW, lessonId: 'lesson-3' }));

      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.lastSeenAt).toEqual(NOW);
      expect(model.lastSeenLessonId).toBe('lesson-3');
    });

    it('bumps lastSeenAt when event is newer than existing row', async () => {
      const existing = CourseProgressReadModel.create({
        id: 'cprm-1',
        userId: 'user-1',
        courseId: 'course-1',
        lessonsCompleted: 1,
        lessonsTotal: 5,
        percent: 20,
        lastSeenAt: EARLIER,
        lastSeenLessonId: 'lesson-1',
      });
      const { handler, readModelRepo } = makeHandler({ existing });
      await handler.handle(makeEvent({ completedAt: NOW, lessonId: 'lesson-3' }));

      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.lastSeenAt).toEqual(NOW);
      expect(model.lastSeenLessonId).toBe('lesson-3');
    });

    it('does NOT bump lastSeenAt when event is older than existing row', async () => {
      const existing = CourseProgressReadModel.create({
        id: 'cprm-1',
        userId: 'user-1',
        courseId: 'course-1',
        lessonsCompleted: 1,
        lessonsTotal: 5,
        percent: 20,
        lastSeenAt: NOW,
        lastSeenLessonId: 'lesson-2',
      });
      const { handler, readModelRepo } = makeHandler({ existing });
      await handler.handle(makeEvent({ completedAt: EARLIER, lessonId: 'lesson-3' }));

      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      // lastSeenAt stays at NOW (the existing row's value)
      expect(model.lastSeenAt).toEqual(NOW);
      expect(model.lastSeenLessonId).toBe('lesson-2');
    });
  });

  describe('idempotency', () => {
    it('second handle call with same event produces same upsert', async () => {
      const { handler, readModelRepo } = makeHandler({ lessonCount: 5, completedCount: 2 });
      const event = makeEvent();
      await handler.handle(event);
      await handler.handle(event);

      expect(readModelRepo.upsert).toHaveBeenCalledTimes(2);
      const [call1, call2] = vi.mocked(readModelRepo.upsert).mock.calls;
      expect((call1?.[0] as CourseProgressReadModel).percent).toBe(
        (call2?.[0] as CourseProgressReadModel).percent,
      );
    });
  });

  describe('zero totals', () => {
    it('sets percent 0 when lessonsTotal is 0', async () => {
      const { handler, readModelRepo } = makeHandler({ lessonCount: 0, completedCount: 0 });
      await handler.handle(makeEvent());

      const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
        .calls[0]![0] as CourseProgressReadModel;
      expect(model.percent).toBe(0);
    });
  });
});

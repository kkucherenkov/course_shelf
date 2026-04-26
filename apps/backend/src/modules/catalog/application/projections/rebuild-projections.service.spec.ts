/**
 * Unit tests for RebuildProjectionsService.
 *
 * Scenario:
 *   Two LessonProgress rows for the same (user, course):
 *     - lesson-1: completed=true, lastSeenAt=EARLIER
 *     - lesson-2: completed=false, lastSeenAt=NOW
 *
 *   Expected rebuild result:
 *     - lessonsCompleted = 1 (only lesson-1)
 *     - lessonsTotal = 3 (course has 3 lessons)
 *     - lastSeenAt = NOW (max of both)
 *     - lastSeenLessonId = lesson-2 (the one with max lastSeenAt)
 */
import { describe, expect, it, vi } from 'vitest';

import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { RebuildProjectionsService } from './rebuild-projections.service';

import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-04-26T10:00:00.000Z');
const EARLIER = new Date('2026-04-25T10:00:00.000Z');

function makeLessonRepo(count = 3): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi
      .fn()
      .mockResolvedValue(
        Array.from({ length: count }, (_, i) => ({ id: `lesson-${String(i + 1)}` })),
      ),
    findBySection: vi.fn(),
  };
}

function makeProgressRepo(opts: {
  pairs?: { userId: string; courseId: string }[];
  completedCount?: number;
  latest?: { lessonId: string; lastSeenAt: Date } | null;
}): LessonProgressRepository {
  const latestValue = 'latest' in opts ? opts.latest : { lessonId: 'lesson-2', lastSeenAt: NOW };
  return {
    save: vi.fn(),
    findByUserAndLesson: vi.fn(),
    countCompletedByUserAndCourse: vi.fn().mockResolvedValue(opts.completedCount ?? 1),
    findAllUserCoursePairs: vi
      .fn()
      .mockResolvedValue(opts.pairs ?? [{ userId: 'user-1', courseId: 'course-1' }]),
    findLatestByUserAndCourse: vi.fn().mockResolvedValue(latestValue),
  };
}

function makeReadModelRepo(): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn().mockResolvedValue(undefined),
    findByUserAndCourse: vi.fn().mockResolvedValue(null),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RebuildProjectionsService', () => {
  it('deletes all rows before rebuilding', async () => {
    const lessonRepo = makeLessonRepo();
    const progressRepo = makeProgressRepo({ pairs: [] });
    const readModelRepo = makeReadModelRepo();
    const service = new RebuildProjectionsService(readModelRepo, lessonRepo, progressRepo);

    await service.rebuild();

    expect(readModelRepo.deleteAll).toHaveBeenCalledOnce();
  });

  it('writes a single read-model row for one (user, course) pair', async () => {
    const lessonRepo = makeLessonRepo(3);
    const progressRepo = makeProgressRepo({
      pairs: [{ userId: 'user-1', courseId: 'course-1' }],
      completedCount: 1,
      latest: { lessonId: 'lesson-2', lastSeenAt: NOW },
    });
    const readModelRepo = makeReadModelRepo();
    const service = new RebuildProjectionsService(readModelRepo, lessonRepo, progressRepo);

    await service.rebuild();

    expect(readModelRepo.upsert).toHaveBeenCalledOnce();
    const model: CourseProgressReadModel = vi.mocked(readModelRepo.upsert).mock
      .calls[0]![0] as CourseProgressReadModel;
    expect(model.userId).toBe('user-1');
    expect(model.courseId).toBe('course-1');
    expect(model.lessonsCompleted).toBe(1);
    expect(model.lessonsTotal).toBe(3);
    expect(model.percent).toBe(33); // round(1/3 * 100) = 33
    expect(model.lastSeenAt).toEqual(NOW);
    expect(model.lastSeenLessonId).toBe('lesson-2');
  });

  it('skips pair when findLatestByUserAndCourse returns null', async () => {
    const lessonRepo = makeLessonRepo(3);
    const progressRepo = makeProgressRepo({
      pairs: [{ userId: 'user-1', courseId: 'course-1' }],
      completedCount: 0,
      latest: null,
    });
    const readModelRepo = makeReadModelRepo();
    const service = new RebuildProjectionsService(readModelRepo, lessonRepo, progressRepo);

    await service.rebuild();

    // deleteAll still runs but upsert does not (null latest → skip)
    expect(readModelRepo.deleteAll).toHaveBeenCalledOnce();
    expect(readModelRepo.upsert).not.toHaveBeenCalled();
  });

  it('processes multiple (user, course) pairs independently', async () => {
    const lessonRepo = makeLessonRepo(3);
    const progressRepo = makeProgressRepo({
      pairs: [
        { userId: 'user-1', courseId: 'course-1' },
        { userId: 'user-2', courseId: 'course-1' },
      ],
      completedCount: 1,
      latest: { lessonId: 'lesson-1', lastSeenAt: EARLIER },
    });
    const readModelRepo = makeReadModelRepo();
    const service = new RebuildProjectionsService(readModelRepo, lessonRepo, progressRepo);

    await service.rebuild();

    expect(readModelRepo.upsert).toHaveBeenCalledTimes(2);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { brand } from '../../../../shared/branded-id';

import { Course } from '../../domain/course/course';
import { Lesson } from '../../domain/lesson/lesson';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { MarkCourseCompleteCommand } from './mark-course-complete.command';
import { MarkCourseCompleteHandler } from './mark-course-complete.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type { QueryBus } from '@nestjs/cqrs';
import type { CourseOutlineDto } from '@app/api-client-ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');
const actor = { id: 'user-1', role: 'user' };

const STUB_OUTLINE: CourseOutlineDto = {
  course: {
    id: 'course-1',
    title: 'My Course',
    lessonsTotal: 2,
    totalDurationSeconds: 150,
    progress: { percent: 100, lessonsCompleted: 2, lessonsTotal: 2 },
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  },
  sections: [],
  materials: [],
};

function makeCourseRepo(): CourseRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findManyByLibrary: vi.fn(),
    findAll: vi.fn(),
    findByIds: vi.fn(),
    findRecentlyAdded: vi.fn(),
  };
}

function makeLessonRepo(): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
  };
}

function makeAuthz(allow = true): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
  };
}

function makeReadModelRepo(
  row: CourseProgressReadModel | null = null,
): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn().mockResolvedValue(row),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
    deleteByUserAndCourse: vi.fn(),
  };
}

function makeLessonProgressRepo(): LessonProgressRepository {
  return {
    save: vi.fn(),
    findByUserAndLesson: vi.fn(),
    countCompletedByUserAndCourse: vi.fn(),
    findAllUserCoursePairs: vi.fn(),
    findLatestByUserAndCourse: vi.fn(),
    aggregateForUserRange: vi.fn(),
    findManyByUserAndLessons: vi.fn(),
    bulkUpsertCompleted: vi.fn(),
    deleteAllByUserAndCourse: vi.fn(),
  };
}

function makeQueryBus(): QueryBus {
  return { execute: vi.fn().mockResolvedValue(STUB_OUTLINE) } as unknown as QueryBus;
}

function makeCourse(): Course {
  return Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: NOW,
  });
}

function makeLesson(id: string, duration?: number): Lesson {
  return Lesson.reconstitute({
    id: brand<string, 'Lesson'>(id),
    courseId: 'course-1',
    sectionId: 'sec-1',
    position: 1,
    title: `Lesson ${id}`,
    videoPath: 'video.mp4',
    mtime: NOW,
    sizeBytes: 1000,
    duration,
    createdAt: NOW,
    updatedAt: NOW,
    materials: [],
    subtitles: [],
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MarkCourseCompleteHandler', () => {
  let courseRepo: CourseRepository;
  let lessonRepo: LessonRepository;
  let lessonProgressRepo: LessonProgressRepository;
  let readModelRepo: CourseProgressReadModelRepository;
  let queryBus: QueryBus;
  let handler: MarkCourseCompleteHandler;

  describe('happy path', () => {
    beforeEach(() => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo(null);
      queryBus = makeQueryBus();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue([
        makeLesson('l1', 60),
        makeLesson('l2', 90),
      ]);

      handler = new MarkCourseCompleteHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );
    });

    it('calls bulkUpsertCompleted with all lesson ids', async () => {
      await handler.execute(new MarkCourseCompleteCommand('course-1', actor));

      expect(lessonProgressRepo.bulkUpsertCompleted).toHaveBeenCalledWith(
        actor.id,
        expect.arrayContaining([
          { id: 'l1', durationSeconds: 60 },
          { id: 'l2', durationSeconds: 90 },
        ]),
        expect.any(Date),
      );
    });

    it('upserts the CourseProgressReadModel with 100% progress', async () => {
      await handler.execute(new MarkCourseCompleteCommand('course-1', actor));

      expect(readModelRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: actor.id,
          courseId: 'course-1',
          lessonsCompleted: 2,
          lessonsTotal: 2,
          percent: 100,
        }),
      );
    });

    it('returns the refreshed outline from QueryBus', async () => {
      const result = await handler.execute(new MarkCourseCompleteCommand('course-1', actor));

      expect(result).toBe(STUB_OUTLINE);
      expect(queryBus.execute).toHaveBeenCalledOnce();
    });
  });

  describe('idempotency — calling twice', () => {
    it('is safe to call twice (bulkUpsertCompleted is idempotent)', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo(null);
      queryBus = makeQueryBus();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue([makeLesson('l1', 60)]);

      handler = new MarkCourseCompleteHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );

      await handler.execute(new MarkCourseCompleteCommand('course-1', actor));
      await handler.execute(new MarkCourseCompleteCommand('course-1', actor));

      // bulkUpsertCompleted is called each time (idempotent at DB level).
      expect(lessonProgressRepo.bulkUpsertCompleted).toHaveBeenCalledTimes(2);
    });
  });

  describe('preserves original completedAt via bulkUpsertCompleted', () => {
    it('delegates completedAt preservation to bulkUpsertCompleted (tested in adapter)', async () => {
      // The handler passes lessons to bulkUpsertCompleted; the Prisma adapter's
      // COALESCE(completedAt, now) logic is what preserves the original timestamp.
      // We verify the handler calls with the correct lesson data.
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo(null);
      queryBus = makeQueryBus();

      const lesson = makeLesson('l1', 120);
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue([lesson]);

      handler = new MarkCourseCompleteHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );

      await handler.execute(new MarkCourseCompleteCommand('course-1', actor));

      expect(lessonProgressRepo.bulkUpsertCompleted).toHaveBeenCalledWith(
        actor.id,
        [{ id: 'l1', durationSeconds: 120 }],
        expect.any(Date),
      );
    });
  });

  describe('empty course — no lessons', () => {
    it('skips bulkUpsertCompleted and still returns outline', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo(null);
      queryBus = makeQueryBus();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue([]);

      handler = new MarkCourseCompleteHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );

      const result = await handler.execute(new MarkCourseCompleteCommand('course-1', actor));

      expect(lessonProgressRepo.bulkUpsertCompleted).not.toHaveBeenCalled();
      expect(result).toBe(STUB_OUTLINE);
    });
  });

  describe('authz exclusion', () => {
    it('throws PermissionDenied when canSee returns false', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new MarkCourseCompleteHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(false),
        makeReadModelRepo(null),
        makeLessonProgressRepo(),
        makeQueryBus(),
      );

      await expect(
        handler.execute(new MarkCourseCompleteCommand('course-1', actor)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('course not found', () => {
    it('throws CourseNotFoundError when course does not exist', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(null);

      handler = new MarkCourseCompleteHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        makeReadModelRepo(null),
        makeLessonProgressRepo(),
        makeQueryBus(),
      );

      await expect(
        handler.execute(new MarkCourseCompleteCommand('missing', actor)),
      ).rejects.toBeInstanceOf(CourseNotFoundError);
    });
  });
});

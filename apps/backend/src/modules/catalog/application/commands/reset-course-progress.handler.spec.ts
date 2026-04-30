import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { ResetCourseProgressCommand } from './reset-course-progress.command';
import { ResetCourseProgressHandler } from './reset-course-progress.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
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
    lessonsTotal: 0,
    totalDurationSeconds: 0,
    progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
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

function makeAuthz(allow = true): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeReadModelRepo(): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn(),
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResetCourseProgressHandler', () => {
  let courseRepo: CourseRepository;
  let lessonProgressRepo: LessonProgressRepository;
  let readModelRepo: CourseProgressReadModelRepository;
  let queryBus: QueryBus;
  let handler: ResetCourseProgressHandler;

  describe('happy path', () => {
    beforeEach(() => {
      courseRepo = makeCourseRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo();
      queryBus = makeQueryBus();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new ResetCourseProgressHandler(
        courseRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );
    });

    it('calls deleteAllByUserAndCourse with correct (userId, courseId)', async () => {
      await handler.execute(new ResetCourseProgressCommand('course-1', actor));

      expect(lessonProgressRepo.deleteAllByUserAndCourse).toHaveBeenCalledWith(
        actor.id,
        'course-1',
      );
    });

    it('calls deleteByUserAndCourse on the read-model repo', async () => {
      await handler.execute(new ResetCourseProgressCommand('course-1', actor));

      expect(readModelRepo.deleteByUserAndCourse).toHaveBeenCalledWith(actor.id, 'course-1');
    });

    it('returns the refreshed outline from QueryBus', async () => {
      const result = await handler.execute(new ResetCourseProgressCommand('course-1', actor));

      expect(result).toBe(STUB_OUTLINE);
      expect(queryBus.execute).toHaveBeenCalledOnce();
    });
  });

  describe('idempotency', () => {
    it('calling twice is safe — deleteAllByUserAndCourse is idempotent', async () => {
      courseRepo = makeCourseRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo();
      queryBus = makeQueryBus();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new ResetCourseProgressHandler(
        courseRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );

      await handler.execute(new ResetCourseProgressCommand('course-1', actor));
      await handler.execute(new ResetCourseProgressCommand('course-1', actor));

      expect(lessonProgressRepo.deleteAllByUserAndCourse).toHaveBeenCalledTimes(2);
    });

    it("does not delete another user's progress", async () => {
      // The handler scopes the delete to the actor's userId — verified by mock call args.
      courseRepo = makeCourseRepo();
      lessonProgressRepo = makeLessonProgressRepo();
      readModelRepo = makeReadModelRepo();
      queryBus = makeQueryBus();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new ResetCourseProgressHandler(
        courseRepo,
        makeAuthz(true),
        readModelRepo,
        lessonProgressRepo,
        queryBus,
      );

      const otherActor = { id: 'other-user', role: 'user' };
      await handler.execute(new ResetCourseProgressCommand('course-1', actor));

      expect(lessonProgressRepo.deleteAllByUserAndCourse).toHaveBeenCalledWith(
        actor.id,
        'course-1',
      );
      expect(lessonProgressRepo.deleteAllByUserAndCourse).not.toHaveBeenCalledWith(
        otherActor.id,
        expect.anything(),
      );
    });
  });

  describe('authz exclusion', () => {
    it('throws PermissionDenied when canSee returns false', async () => {
      courseRepo = makeCourseRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new ResetCourseProgressHandler(
        courseRepo,
        makeAuthz(false),
        makeReadModelRepo(),
        makeLessonProgressRepo(),
        makeQueryBus(),
      );

      await expect(
        handler.execute(new ResetCourseProgressCommand('course-1', actor)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('course not found', () => {
    it('throws CourseNotFoundError when course does not exist', async () => {
      courseRepo = makeCourseRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(null);

      handler = new ResetCourseProgressHandler(
        courseRepo,
        makeAuthz(true),
        makeReadModelRepo(),
        makeLessonProgressRepo(),
        makeQueryBus(),
      );

      await expect(
        handler.execute(new ResetCourseProgressCommand('missing', actor)),
      ).rejects.toBeInstanceOf(CourseNotFoundError);
    });
  });
});

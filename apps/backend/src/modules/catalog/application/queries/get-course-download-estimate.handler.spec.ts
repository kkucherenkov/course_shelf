import { beforeEach, describe, expect, it, vi } from 'vitest';
import { brand } from '../../../../shared/branded-id';

import { Course } from '../../domain/course/course';
import { Lesson } from '../../domain/lesson/lesson';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { GetCourseDownloadEstimateQuery } from './get-course-download-estimate.query';
import { GetCourseDownloadEstimateHandler } from './get-course-download-estimate.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

const adminActor = { id: 'user-1', role: 'admin' };

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
    listAccessibleLibraryIds: vi.fn().mockResolvedValue(null),
  };
}

function makeCourse(opts: { id?: string } = {}): Course {
  return Course.create({
    id: opts.id ?? 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    description: 'A test course',
    now: NOW,
  });
}

function makeLesson(opts: {
  id: string;
  sectionId: string;
  position: number;
  sizeBytes: number;
}): Lesson {
  return Lesson.reconstitute({
    id: brand<string, 'Lesson'>(opts.id),
    courseId: 'course-1',
    sectionId: opts.sectionId,
    position: opts.position,
    title: `Lesson ${opts.position}`,
    videoPath: 'video.mp4',
    mtime: NOW,
    sizeBytes: opts.sizeBytes,
    duration: undefined,
    createdAt: NOW,
    updatedAt: NOW,
    materials: [],
    subtitles: [],
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetCourseDownloadEstimateHandler', () => {
  let courseRepo: CourseRepository;
  let lessonRepo: LessonRepository;
  let handler: GetCourseDownloadEstimateHandler;

  describe('happy path — course with several lessons', () => {
    beforeEach(() => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();

      const lessons = [
        makeLesson({ id: 'l1', sectionId: 'sec-1', position: 1, sizeBytes: 1000 }),
        makeLesson({ id: 'l2', sectionId: 'sec-1', position: 2, sizeBytes: 2500 }),
        makeLesson({ id: 'l3', sectionId: 'sec-2', position: 1, sizeBytes: 500 }),
      ];

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue(lessons);

      handler = new GetCourseDownloadEstimateHandler(courseRepo, lessonRepo, makeAuthz(true));
    });

    it('sums sizeBytes across all lessons and reports the lesson count', async () => {
      const result = await handler.execute(
        new GetCourseDownloadEstimateQuery('course-1', adminActor),
      );

      expect(result).toEqual({ courseId: 'course-1', totalBytes: 4000, lessonCount: 3 });
    });
  });

  describe('empty course — no lessons', () => {
    beforeEach(() => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue([]);

      handler = new GetCourseDownloadEstimateHandler(courseRepo, lessonRepo, makeAuthz(true));
    });

    it('returns zero totalBytes and zero lessonCount', async () => {
      const result = await handler.execute(
        new GetCourseDownloadEstimateQuery('course-1', adminActor),
      );

      expect(result).toEqual({ courseId: 'course-1', totalBytes: 0, lessonCount: 0 });
    });
  });

  describe('course not found', () => {
    it('throws CourseNotFoundError when course does not exist, before checking the grant', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(null);

      const authz = makeAuthz(true);
      handler = new GetCourseDownloadEstimateHandler(courseRepo, lessonRepo, authz);

      await expect(
        handler.execute(new GetCourseDownloadEstimateQuery('missing', adminActor)),
      ).rejects.toBeInstanceOf(CourseNotFoundError);

      expect(authz.canSee).not.toHaveBeenCalled();
    });
  });

  describe('authz exclusion', () => {
    it('throws PermissionDenied when canSee returns false, after existence is confirmed', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new GetCourseDownloadEstimateHandler(courseRepo, lessonRepo, makeAuthz(false));

      await expect(
        handler.execute(new GetCourseDownloadEstimateQuery('course-1', adminActor)),
      ).rejects.toBeInstanceOf(PermissionDenied);

      expect(lessonRepo.findByCourse).not.toHaveBeenCalled();
    });
  });
});

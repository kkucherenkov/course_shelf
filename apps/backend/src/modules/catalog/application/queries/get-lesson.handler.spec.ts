/**
 * Unit tests for GetLessonHandler.
 *
 * Scenarios:
 *   1. Admin actor → happy path → LessonDto returned.
 *   2. Non-admin actor with a grant → LessonDto returned.
 *   3. Non-admin actor without a grant → PermissionDenied.
 *   4. Lesson not found → LessonNotFoundError.
 *   5. Parent course missing (defensive) → LessonNotFoundError.
 *   6. The returned DTO carries NO path fields anywhere (NFR-S-01).
 *   7. Progress reads from projection when row exists and lesson matches.
 *   8. Progress falls back to zero placeholder when no projection row.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Course } from '../../domain/course/course';
import { Lesson } from '../../domain/lesson/lesson';
import { Material } from '../../domain/lesson/material';
import { Subtitle } from '../../domain/lesson/subtitle';
import { LessonNotFoundError } from '../../domain/lesson/lesson.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { GetLessonQuery } from './get-lesson.query';
import { GetLessonHandler } from './get-lesson.handler';

import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeLessonRepo(): LessonRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByCourse: vi.fn(),
    findBySection: vi.fn(),
    getLessonStatsByCourseIds: vi.fn(),
  };
}

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

function makeAuthz(allow: boolean): AuthorizationService {
  return {
    canSee: vi.fn().mockResolvedValue(allow),
    invalidate: vi.fn(),
  };
}

function makeProgressRepo(
  row: CourseProgressReadModel | null = null,
): CourseProgressReadModelRepository {
  return {
    upsert: vi.fn(),
    findByUserAndCourse: vi.fn().mockResolvedValue(row),
    findManyByUser: vi.fn(),
    findManyByCourseIdsForUser: vi.fn(),
    deleteAll: vi.fn(),
    findCompletedByUser: vi.fn(),
  };
}

function makeLesson(): Lesson {
  const lesson = Lesson.create({
    id: 'lesson-1',
    courseId: 'course-1',
    sectionId: 'section-1',
    position: 1,
    title: '01 - Intro',
    videoPath: '/lib/course/01 - Intro.mp4',
    mtime: NOW,
    sizeBytes: 1000,
    now: NOW,
  });
  lesson.addMaterial(
    Material.fromFile({ id: 'm1', path: '/lib/course/01 - Intro.pdf', sizeBytes: 500 }),
  );
  lesson.addSubtitle(Subtitle.fromFile({ id: 's1', path: '/lib/course/01 - Intro.en.srt' }));
  return lesson;
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

function makeProgressRow(lastSeenLessonId = 'lesson-1'): CourseProgressReadModel {
  return CourseProgressReadModel.create({
    id: 'cprm-1',
    userId: 'admin-1',
    courseId: 'course-1',
    lessonsCompleted: 2,
    lessonsTotal: 5,
    percent: 40,
    lastSeenAt: NOW,
    lastSeenLessonId,
  });
}

const adminActor = { id: 'admin-1', role: 'admin' };
const userActor = { id: 'user-1', role: 'user' };

// ---------------------------------------------------------------------------
// Recursive helper: assert no `path` key anywhere in an object tree (NFR-S-01)
// ---------------------------------------------------------------------------
function assertNoPaths(value: unknown, location = 'root'): void {
  if (value === null || value === undefined) return;
  if (typeof value === 'object') {
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      expect(key, `Found "path" field at ${location}.${key}`).not.toBe('path');
      assertNoPaths(val, `${location}.${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetLessonHandler', () => {
  let lessonRepo: LessonRepository;
  let courseRepo: CourseRepository;

  // -------------------------------------------------------------------------
  // Admin happy path
  // -------------------------------------------------------------------------
  describe('admin actor', () => {
    beforeEach(() => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
    });

    it('returns LessonDto when lesson + course exist', async () => {
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      expect(result.id).toBe('lesson-1');
      expect(result.courseId).toBe('course-1');
      expect(result.sectionId).toBe('section-1');
      expect(result.position).toBe(1);
      expect(result.title).toBe('01 - Intro');
      expect(result.materials).toHaveLength(1);
      expect(result.materials[0]!.kind).toBe('doc');
      expect(result.subtitles).toHaveLength(1);
      expect(result.subtitles[0]!.language).toBe('en');
    });

    it('progress is zero placeholder when no projection row', async () => {
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(null),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      expect(result.progress).toEqual({ percent: 0, completed: false, lastSeenAtSeconds: 0 });
    });

    it('progress is populated from projection when lastSeenLessonId matches', async () => {
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const progressRow = makeProgressRow('lesson-1'); // matches lesson.id
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(progressRow),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      // percent comes from the course progress row
      expect(result.progress.percent).toBe(40);
    });

    it('progress is zero placeholder when projection row exists but lastSeenLessonId differs', async () => {
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const progressRow = makeProgressRow('lesson-2'); // different from lesson.id
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(progressRow),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      expect(result.progress).toEqual({ percent: 0, completed: false, lastSeenAtSeconds: 0 });
    });

    it('durationSeconds is omitted when lesson has no duration', async () => {
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      expect('durationSeconds' in result).toBe(false);
    });

    it('reads progress from repo — findByUserAndCourse called with actor.id', async () => {
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const progressRepo = makeProgressRepo(null);
      const handler = new GetLessonHandler(lessonRepo, courseRepo, makeAuthz(true), progressRepo);

      await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      expect(progressRepo.findByUserAndCourse).toHaveBeenCalledWith('admin-1', 'course-1');
    });
  });

  // -------------------------------------------------------------------------
  // Non-admin with grant
  // -------------------------------------------------------------------------
  describe('non-admin actor with grant', () => {
    it('returns LessonDto when user has a grant', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', userActor));

      expect(result.id).toBe('lesson-1');
    });
  });

  // -------------------------------------------------------------------------
  // Non-admin without grant
  // -------------------------------------------------------------------------
  describe('non-admin actor without grant', () => {
    it('throws PermissionDenied', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(false),
        makeProgressRepo(),
      );

      await expect(
        handler.execute(new GetLessonQuery('lesson-1', userActor)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  // -------------------------------------------------------------------------
  // Lesson not found
  // -------------------------------------------------------------------------
  describe('missing lesson', () => {
    it('throws LessonNotFoundError when lesson does not exist', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(null);
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(),
      );

      await expect(
        handler.execute(new GetLessonQuery('missing', adminActor)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Missing parent course (defensive)
  // -------------------------------------------------------------------------
  describe('missing parent course', () => {
    it('throws LessonNotFoundError when parent course is missing', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(null);
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(),
      );

      await expect(
        handler.execute(new GetLessonQuery('lesson-1', adminActor)),
      ).rejects.toBeInstanceOf(LessonNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // NFR-S-01: no path fields in the DTO
  // -------------------------------------------------------------------------
  describe('DTO never exposes path fields (NFR-S-01)', () => {
    it('assertNoPaths: returned DTO contains no "path" key at any depth', async () => {
      lessonRepo = makeLessonRepo();
      courseRepo = makeCourseRepo();
      vi.mocked(lessonRepo.findById).mockResolvedValue(makeLesson());
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      const handler = new GetLessonHandler(
        lessonRepo,
        courseRepo,
        makeAuthz(true),
        makeProgressRepo(),
      );

      const result = await handler.execute(new GetLessonQuery('lesson-1', adminActor));

      assertNoPaths(result);
    });
  });
});

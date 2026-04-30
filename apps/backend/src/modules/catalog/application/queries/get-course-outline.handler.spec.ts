import { beforeEach, describe, expect, it, vi } from 'vitest';
import { brand } from '../../../../shared/branded-id';

import { Course } from '../../domain/course/course';
import { Lesson } from '../../domain/lesson/lesson';
import { Material } from '../../domain/lesson/material';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { CourseProgressReadModel } from '../../domain/progress/course-progress-read-model';
import { LessonProgress } from '../../../../common/learning-progress';
import { GetCourseOutlineQuery } from './get-course-outline.query';
import { GetCourseOutlineHandler } from './get-course-outline.handler';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';

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
    deleteByUserAndCourse: vi.fn(),
  };
}

function makeLessonProgressRepo(rows: LessonProgress[] = []): LessonProgressRepository {
  return {
    save: vi.fn(),
    findByUserAndLesson: vi.fn(),
    countCompletedByUserAndCourse: vi.fn(),
    findAllUserCoursePairs: vi.fn(),
    findLatestByUserAndCourse: vi.fn(),
    aggregateForUserRange: vi.fn(),
    findManyByUserAndLessons: vi.fn().mockResolvedValue(rows),
    bulkUpsertCompleted: vi.fn(),
    deleteAllByUserAndCourse: vi.fn(),
  };
}

function makeCourse(
  opts: { id?: string; sections?: { id: string; position: number; title: string }[] } = {},
): Course {
  const c = Course.create({
    id: opts.id ?? 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    description: 'A test course',
    now: NOW,
  });
  if (opts.sections) {
    for (const s of opts.sections) {
      c.addSection({ id: s.id, title: s.title, position: s.position });
    }
  }
  return c;
}

function makeLesson(opts: {
  id: string;
  sectionId: string;
  position: number;
  duration?: number;
  materials?: Material[];
}): Lesson {
  return Lesson.reconstitute({
    id: brand<string, 'Lesson'>(opts.id),
    courseId: 'course-1',
    sectionId: opts.sectionId,
    position: opts.position,
    title: `Lesson ${opts.position}`,
    videoPath: 'video.mp4',
    mtime: NOW,
    sizeBytes: 1000,
    duration: opts.duration,
    createdAt: NOW,
    updatedAt: NOW,
    materials: opts.materials ?? [],
    subtitles: [],
  });
}

function makeMaterial(id: string): Material {
  return Material.reconstitute({
    id,
    kind: 'doc',
    label: 'Notes',
    path: 'notes.pdf',
    sizeBytes: 512,
  });
}

function makeLessonProgress(
  lessonId: string,
  opts: { completed?: boolean; percent?: number } = {},
): LessonProgress {
  return LessonProgress.reconstitute({
    id: `lp-${lessonId}`,
    userId: adminActor.id,
    lessonId,
    positionSeconds: 10,
    durationSeconds: 100,
    percent: opts.percent ?? 0,
    completed: opts.completed ?? false,
    lastSeenAt: NOW,
    completedAt: opts.completed ? NOW : undefined,
    createdAt: NOW,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetCourseOutlineHandler', () => {
  let courseRepo: CourseRepository;
  let lessonRepo: LessonRepository;
  let handler: GetCourseOutlineHandler;

  describe('happy path — course with two sections, various lesson states', () => {
    beforeEach(() => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();

      const course = makeCourse({
        sections: [
          { id: 'sec-1', position: 1, title: 'Section 1' },
          { id: 'sec-2', position: 2, title: 'Section 2' },
        ],
      });

      const mat = makeMaterial('mat-1');
      const lessons = [
        makeLesson({ id: 'l1', sectionId: 'sec-1', position: 1, duration: 60, materials: [mat] }),
        makeLesson({ id: 'l2', sectionId: 'sec-1', position: 2, duration: 90 }),
        makeLesson({ id: 'l3', sectionId: 'sec-2', position: 1, duration: 120 }),
      ];

      vi.mocked(courseRepo.findById).mockResolvedValue(course);
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue(lessons);

      const progressRows = [
        makeLessonProgress('l1', { completed: true, percent: 100 }),
        makeLessonProgress('l2', { percent: 45 }),
        // l3 has no progress row → not-started
      ];

      const courseProgressRow = CourseProgressReadModel.create({
        id: 'cprm-1',
        userId: adminActor.id,
        courseId: 'course-1',
        lessonsCompleted: 1,
        lessonsTotal: 3,
        percent: 33,
        lastSeenAt: NOW,
        lastSeenLessonId: 'l1',
      });

      handler = new GetCourseOutlineHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        makeProgressRepo(courseProgressRow),
        makeLessonProgressRepo(progressRows),
      );
    });

    it('returns the correct course summary', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.course.id).toBe('course-1');
      expect(result.course.title).toBe('My Course');
      expect(result.course.description).toBe('A test course');
      expect(result.course.lessonsTotal).toBe(3);
      expect(result.course.totalDurationSeconds).toBe(270);
      expect(result.course.progress).toEqual({ percent: 33, lessonsCompleted: 1, lessonsTotal: 3 });
    });

    it('returns sections with correct totalDurationSeconds', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.sections).toHaveLength(2);
      expect(result.sections[0]?.id).toBe('sec-1');
      expect(result.sections[0]?.totalDurationSeconds).toBe(150); // 60 + 90
      expect(result.sections[1]?.id).toBe('sec-2');
      expect(result.sections[1]?.totalDurationSeconds).toBe(120);
    });

    it('derives lesson state: completed', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));
      const l1 = result.sections[0]?.lessons[0];

      expect(l1?.state).toBe('completed');
      expect(l1?.progressPercent).toBe(100);
      expect(l1?.hasMaterials).toBe(true);
    });

    it('derives lesson state: in-progress', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));
      const l2 = result.sections[0]?.lessons[1];

      expect(l2?.state).toBe('in-progress');
      expect(l2?.progressPercent).toBe(45);
    });

    it('derives lesson state: not-started', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));
      const l3 = result.sections[1]?.lessons[0];

      expect(l3?.state).toBe('not-started');
      expect(l3?.progressPercent).toBe(0);
    });

    it('aggregates materials flat, ordered by (lesson.position, material.id)', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0]).toMatchObject({
        id: 'mat-1',
        lessonId: 'l1',
        kind: 'doc',
        label: 'Notes',
        sizeBytes: 512,
      });
    });
  });

  describe('empty course — no sections', () => {
    beforeEach(() => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();

      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue([]);

      handler = new GetCourseOutlineHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        makeProgressRepo(null),
        makeLessonProgressRepo([]),
      );
    });

    it('returns empty sections and materials arrays', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.sections).toEqual([]);
      expect(result.materials).toEqual([]);
      expect(result.course.lessonsTotal).toBe(0);
      expect(result.course.totalDurationSeconds).toBe(0);
    });

    it('returns zero progress placeholder when no projection row', async () => {
      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.course.progress).toEqual({ percent: 0, lessonsCompleted: 0, lessonsTotal: 0 });
    });
  });

  describe('authz exclusion', () => {
    it('throws PermissionDenied when canSee returns false', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(makeCourse());

      handler = new GetCourseOutlineHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(false),
        makeProgressRepo(null),
        makeLessonProgressRepo([]),
      );

      await expect(
        handler.execute(new GetCourseOutlineQuery('course-1', adminActor)),
      ).rejects.toBeInstanceOf(PermissionDenied);
    });
  });

  describe('course not found', () => {
    it('throws CourseNotFoundError when course does not exist', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();
      vi.mocked(courseRepo.findById).mockResolvedValue(null);

      handler = new GetCourseOutlineHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        makeProgressRepo(null),
        makeLessonProgressRepo([]),
      );

      await expect(
        handler.execute(new GetCourseOutlineQuery('missing', adminActor)),
      ).rejects.toBeInstanceOf(CourseNotFoundError);
    });
  });

  describe('materials aggregation across multiple lessons', () => {
    it('merges materials from multiple lessons ordered by lesson position then material id', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();

      const course = makeCourse({
        sections: [{ id: 'sec-1', position: 1, title: 'S1' }],
      });

      const mat1 = makeMaterial('mat-aaa');
      const mat2 = makeMaterial('mat-zzz');
      const mat3 = makeMaterial('mat-bbb');

      const lessons = [
        makeLesson({
          id: 'l1',
          sectionId: 'sec-1',
          position: 1,
          duration: 60,
          materials: [mat1, mat2],
        }),
        makeLesson({ id: 'l2', sectionId: 'sec-1', position: 2, duration: 60, materials: [mat3] }),
      ];

      vi.mocked(courseRepo.findById).mockResolvedValue(course);
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue(lessons);

      handler = new GetCourseOutlineHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        makeProgressRepo(null),
        makeLessonProgressRepo([]),
      );

      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.materials.map((m) => m.id)).toEqual(['mat-aaa', 'mat-zzz', 'mat-bbb']);
    });
  });

  describe('null duration — treated as 0', () => {
    it('treats undefined lesson duration as 0 in section/course totals', async () => {
      courseRepo = makeCourseRepo();
      lessonRepo = makeLessonRepo();

      const course = makeCourse({
        sections: [{ id: 'sec-1', position: 1, title: 'S1' }],
      });

      const lessons = [
        makeLesson({ id: 'l1', sectionId: 'sec-1', position: 1 }), // duration undefined
      ];

      vi.mocked(courseRepo.findById).mockResolvedValue(course);
      vi.mocked(lessonRepo.findByCourse).mockResolvedValue(lessons);

      handler = new GetCourseOutlineHandler(
        courseRepo,
        lessonRepo,
        makeAuthz(true),
        makeProgressRepo(null),
        makeLessonProgressRepo([]),
      );

      const result = await handler.execute(new GetCourseOutlineQuery('course-1', adminActor));

      expect(result.sections[0]?.totalDurationSeconds).toBe(0);
      expect(result.course.totalDurationSeconds).toBe(0);
      expect(result.sections[0]?.lessons[0]?.durationSeconds).toBe(0);
    });
  });
});

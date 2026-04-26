/**
 * Unit tests for CourseProgressReadModel value object.
 */
import { describe, expect, it } from 'vitest';

import { CourseProgressReadModel } from './course-progress-read-model';

const NOW = new Date('2026-04-26T10:00:00.000Z');

const BASE_PROPS = {
  id: 'cprm-1',
  userId: 'user-1',
  courseId: 'course-1',
  lessonsCompleted: 3,
  lessonsTotal: 10,
  percent: 30,
  lastSeenAt: NOW,
  lastSeenLessonId: 'lesson-3',
} as const;

describe('CourseProgressReadModel', () => {
  it('create() stores all props', () => {
    const model = CourseProgressReadModel.create(BASE_PROPS);

    expect(model.id).toBe('cprm-1');
    expect(model.userId).toBe('user-1');
    expect(model.courseId).toBe('course-1');
    expect(model.lessonsCompleted).toBe(3);
    expect(model.lessonsTotal).toBe(10);
    expect(model.percent).toBe(30);
    expect(model.lastSeenAt).toEqual(NOW);
    expect(model.lastSeenLessonId).toBe('lesson-3');
  });

  it('reconstitute() stores all props identically to create()', () => {
    const model = CourseProgressReadModel.reconstitute(BASE_PROPS);

    expect(model.id).toBe(BASE_PROPS.id);
    expect(model.userId).toBe(BASE_PROPS.userId);
    expect(model.courseId).toBe(BASE_PROPS.courseId);
    expect(model.lessonsCompleted).toBe(BASE_PROPS.lessonsCompleted);
    expect(model.lessonsTotal).toBe(BASE_PROPS.lessonsTotal);
    expect(model.percent).toBe(BASE_PROPS.percent);
    expect(model.lastSeenAt).toEqual(BASE_PROPS.lastSeenAt);
    expect(model.lastSeenLessonId).toBe(BASE_PROPS.lastSeenLessonId);
  });

  it('two creates with the same props produce equal field values', () => {
    const a = CourseProgressReadModel.create(BASE_PROPS);
    const b = CourseProgressReadModel.create(BASE_PROPS);

    expect(a.id).toBe(b.id);
    expect(a.percent).toBe(b.percent);
    expect(a.lastSeenLessonId).toBe(b.lastSeenLessonId);
  });

  it('zero-progress state is valid', () => {
    const model = CourseProgressReadModel.create({
      id: 'cprm-zero',
      userId: 'user-1',
      courseId: 'course-1',
      lessonsCompleted: 0,
      lessonsTotal: 0,
      percent: 0,
      lastSeenAt: NOW,
      lastSeenLessonId: 'lesson-1',
    });

    expect(model.lessonsCompleted).toBe(0);
    expect(model.lessonsTotal).toBe(0);
    expect(model.percent).toBe(0);
  });
});

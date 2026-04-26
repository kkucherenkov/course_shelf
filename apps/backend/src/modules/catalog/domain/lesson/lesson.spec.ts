/**
 * Unit tests for the Lesson aggregate.
 *
 * Covers:
 *   - Lesson.create happy path — all fields are set correctly.
 *   - Lesson.create invariants — duration is undefined by default.
 *   - addMaterial happy path and duplicate-id rejection.
 *   - addSubtitle happy path and duplicate-id rejection.
 *   - setDuration sets / clears duration.
 *   - updateSignature refreshes mtime + sizeBytes without touching materials/subtitles.
 */
import { describe, expect, it } from 'vitest';

import { Lesson } from './lesson';
import { Material } from './material';
import { Subtitle } from './subtitle';
import { LessonPositionConflictError } from './lesson.errors';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function makeLesson(): Lesson {
  return Lesson.create({
    id: 'lesson-1',
    courseId: 'course-1',
    sectionId: 'section-1',
    position: 1,
    title: 'Intro',
    videoPath: '/lib/course/01 - Intro.mp4',
    mtime: NOW,
    sizeBytes: 1000,
    now: NOW,
  });
}

function makeMaterial(id = 'm1'): Material {
  return Material.fromFile({ id, path: `/lib/course/${id}.pdf`, sizeBytes: 500 });
}

function makeSubtitle(id = 's1'): Subtitle {
  return Subtitle.fromFile({ id, path: `/lib/course/${id}.en.srt` });
}

describe('Lesson.create', () => {
  it('sets all fields from props', () => {
    const lesson = makeLesson();

    expect(lesson.id).toBe('lesson-1');
    expect(lesson.courseId).toBe('course-1');
    expect(lesson.sectionId).toBe('section-1');
    expect(lesson.position).toBe(1);
    expect(lesson.title).toBe('Intro');
    expect(lesson.videoPath).toBe('/lib/course/01 - Intro.mp4');
    expect(lesson.mtime).toEqual(NOW);
    expect(lesson.sizeBytes).toBe(1000);
    expect(lesson.createdAt).toEqual(NOW);
    expect(lesson.updatedAt).toEqual(NOW);
  });

  it('duration is undefined by default', () => {
    const lesson = makeLesson();
    expect(lesson.duration).toBeUndefined();
  });

  it('materials and subtitles are empty by default', () => {
    const lesson = makeLesson();
    expect(lesson.materials).toHaveLength(0);
    expect(lesson.subtitles).toHaveLength(0);
  });
});

describe('addMaterial', () => {
  it('appends the material to the lesson', () => {
    const lesson = makeLesson();
    const material = makeMaterial();
    lesson.addMaterial(material);

    expect(lesson.materials).toHaveLength(1);
    expect(lesson.materials[0]!.id).toBe('m1');
  });

  it('throws LessonPositionConflictError on duplicate material id', () => {
    const lesson = makeLesson();
    lesson.addMaterial(makeMaterial('m1'));

    expect(() => lesson.addMaterial(makeMaterial('m1'))).toThrow(LessonPositionConflictError);
  });
});

describe('addSubtitle', () => {
  it('appends the subtitle to the lesson', () => {
    const lesson = makeLesson();
    lesson.addSubtitle(makeSubtitle());

    expect(lesson.subtitles).toHaveLength(1);
    expect(lesson.subtitles[0]!.id).toBe('s1');
  });

  it('throws LessonPositionConflictError on duplicate subtitle id', () => {
    const lesson = makeLesson();
    lesson.addSubtitle(makeSubtitle('s1'));

    expect(() => lesson.addSubtitle(makeSubtitle('s1'))).toThrow(LessonPositionConflictError);
  });
});

describe('setDuration', () => {
  it('sets the duration in seconds', () => {
    const lesson = makeLesson();
    lesson.setDuration(3600);
    expect(lesson.duration).toBe(3600);
  });

  it('clears duration when passed undefined', () => {
    const lesson = makeLesson();
    lesson.setDuration(3600);
    lesson.setDuration(undefined);
    expect(lesson.duration).toBeUndefined();
  });
});

describe('updateSignature', () => {
  it('refreshes mtime and sizeBytes', () => {
    const lesson = makeLesson();
    const newMtime = new Date('2026-06-01T00:00:00.000Z');
    lesson.updateSignature({ mtime: newMtime, sizeBytes: 2000 });

    expect(lesson.mtime).toEqual(newMtime);
    expect(lesson.sizeBytes).toBe(2000);
  });

  it('does not remove existing materials or subtitles', () => {
    const lesson = makeLesson();
    lesson.addMaterial(makeMaterial());
    lesson.addSubtitle(makeSubtitle());

    lesson.updateSignature({ mtime: new Date(), sizeBytes: 2000 });

    expect(lesson.materials).toHaveLength(1);
    expect(lesson.subtitles).toHaveLength(1);
  });
});

import { computed, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import type { Course, CourseState } from './types';
import { useCourseProgress } from './use-course-progress';

const baseCourse: Course = {
  id: '1',
  title: 'Test Course',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 0,
  accent: 'teal',
};

describe('useCourseProgress', () => {
  // --- pct derivation ---

  it('returns pct=100 when state=completed regardless of completed/lessons', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 0, lessons: 10 }),
      () => 'completed',
    );
    expect(pct.value).toBe(100);
  });

  it('returns pct=0 when state=not-started regardless of completed/lessons', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 6, lessons: 10 }),
      () => 'not-started',
    );
    expect(pct.value).toBe(0);
  });

  it('returns pct=0 when state=locked', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 6, lessons: 10 }),
      () => 'locked',
    );
    expect(pct.value).toBe(0);
  });

  it('computes pct from completed/lessons when state=in-progress', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 4, lessons: 12 }),
      () => 'in-progress',
    );
    expect(pct.value).toBe(33);
  });

  it('computes pct from completed/lessons when state=auto', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 6, lessons: 12 }),
      () => 'auto',
    );
    expect(pct.value).toBe(50);
  });

  it('clamps pct to 100 even if completed > lessons', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 15, lessons: 10 }),
      () => 'in-progress',
    );
    expect(pct.value).toBe(100);
  });

  it('returns pct=0 when lessons=0 to avoid division by zero', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 0, lessons: 0 }),
      () => 'auto',
    );
    expect(pct.value).toBe(0);
  });

  it('rounds pct correctly (1/3 → 33)', () => {
    const { pct } = useCourseProgress(
      () => ({ ...baseCourse, completed: 1, lessons: 3 }),
      () => 'auto',
    );
    expect(pct.value).toBe(33);
  });

  // --- realState derivation (auto) ---

  it('realState=completed when pct===100 and state=auto', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 12, lessons: 12 }),
      () => 'auto',
    );
    expect(realState.value).toBe('completed');
  });

  it('realState=in-progress when 0<pct<100 and state=auto', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 4, lessons: 12 }),
      () => 'auto',
    );
    expect(realState.value).toBe('in-progress');
  });

  it('realState=not-started when pct===0 and state=auto', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 0, lessons: 12 }),
      () => 'auto',
    );
    expect(realState.value).toBe('not-started');
  });

  // --- explicit non-auto states ---

  it('realState passes through not-started when state=not-started', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 6, lessons: 12 }),
      () => 'not-started',
    );
    expect(realState.value).toBe('not-started');
  });

  it('realState passes through in-progress when state=in-progress', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 6, lessons: 12 }),
      () => 'in-progress',
    );
    expect(realState.value).toBe('in-progress');
  });

  it('realState passes through completed when state=completed', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 0, lessons: 12 }),
      () => 'completed',
    );
    expect(realState.value).toBe('completed');
  });

  it('realState passes through locked when state=locked', () => {
    const { realState } = useCourseProgress(
      () => ({ ...baseCourse, completed: 6, lessons: 12 }),
      () => 'locked',
    );
    expect(realState.value).toBe('locked');
  });

  // --- reactivity ---

  it('reacts to changes in course.completed (thunk form)', () => {
    const courseData = ref<Course>({ ...baseCourse, completed: 0, lessons: 10 });
    const stateData = ref<CourseState>('auto');

    const { pct, realState } = useCourseProgress(
      () => courseData.value,
      () => stateData.value,
    );

    expect(pct.value).toBe(0);
    expect(realState.value).toBe('not-started');

    courseData.value = { ...baseCourse, completed: 5, lessons: 10 };
    expect(pct.value).toBe(50);
    expect(realState.value).toBe('in-progress');

    courseData.value = { ...baseCourse, completed: 10, lessons: 10 };
    expect(pct.value).toBe(100);
    expect(realState.value).toBe('completed');
  });

  it('reacts to changes in state (ComputedRef form)', () => {
    const stateData = ref<CourseState>('auto');
    const stateRef = computed(() => stateData.value);
    const courseRef = computed(() => ({ ...baseCourse, completed: 6, lessons: 12 }));

    const { pct, realState } = useCourseProgress(courseRef, stateRef);

    expect(pct.value).toBe(50);
    expect(realState.value).toBe('in-progress');

    stateData.value = 'locked';
    expect(pct.value).toBe(0);
    expect(realState.value).toBe('locked');
  });
});

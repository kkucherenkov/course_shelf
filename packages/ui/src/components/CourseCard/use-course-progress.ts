import { computed, type ComputedRef } from 'vue';

import type { Course, CourseRealState, CourseState } from './types';

export function useCourseProgress(
  course: ComputedRef<Course> | (() => Course),
  state: ComputedRef<CourseState> | (() => CourseState),
): { pct: ComputedRef<number>; realState: ComputedRef<CourseRealState> } {
  const courseRef = typeof course === 'function' ? computed(course) : course;
  const stateRef = typeof state === 'function' ? computed(state) : state;

  const pct = computed<number>(() => {
    const c = courseRef.value;
    const s = stateRef.value;
    if (s === 'completed') return 100;
    if (s === 'not-started' || s === 'locked') return 0;
    if (c.lessons <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((c.completed / c.lessons) * 100)));
  });

  const realState = computed<CourseRealState>(() => {
    const s = stateRef.value;
    if (s !== 'auto') return s;
    const p = pct.value;
    if (p === 100) return 'completed';
    if (p > 0) return 'in-progress';
    return 'not-started';
  });

  return { pct, realState };
}

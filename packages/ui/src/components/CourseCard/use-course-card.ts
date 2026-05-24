import { computed, type ComputedRef } from 'vue';

import { COVER, initials } from './cover-map';
import { useCourseProgress } from './use-course-progress';
import type { Course, CourseState, CourseRealState } from './types';

export interface UseCourseCard {
  pct: ComputedRef<number>;
  realState: ComputedRef<CourseRealState>;
  coverStyle: ComputedRef<{ background: string }>;
  coverInitials: ComputedRef<string>;
  /** Spread onto the card root; empty when the card is presentational. */
  interactiveAttrs: ComputedRef<Record<string, unknown>>;
  /** Whether a click/keydown should emit the card's `click`. */
  shouldActivate: (event: MouseEvent | KeyboardEvent) => boolean;
}

/**
 * Shared logic for the course-card family (poster + wide). Both cards differ
 * in layout but agree on cover, initials, progress, and the
 * interactive-vs-presentational contract — keeping that here means a fix to
 * one (e.g. un-nesting `role=button` from a wrapping link) reaches both.
 *
 * `interactive` (default `true` at the component) keeps standalone button
 * semantics; pass `false` when the card is wrapped in a link so the anchor
 * owns navigation, focus, and the accessible name.
 */
export function useCourseCard(
  course: () => Course,
  state: () => CourseState,
  interactive: () => boolean,
): UseCourseCard {
  const courseRef = computed(course);
  const { pct, realState } = useCourseProgress(course, state);

  const coverStyle = computed(() => ({
    background: courseRef.value.cover ?? COVER[courseRef.value.accent],
  }));
  const coverInitials = computed(() => initials(courseRef.value.title));

  const interactiveAttrs = computed<Record<string, unknown>>(() =>
    interactive() ? { role: 'button', tabindex: 0, 'aria-label': courseRef.value.title } : {},
  );

  function shouldActivate(event: MouseEvent | KeyboardEvent): boolean {
    if (!interactive()) return false;
    if (event instanceof KeyboardEvent && event.key !== 'Enter' && event.key !== ' ') return false;
    return true;
  }

  return { pct, realState, coverStyle, coverInitials, interactiveAttrs, shouldActivate };
}

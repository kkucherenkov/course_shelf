/**
 * Spec for CourseSectionsList.
 *
 * Covers that it applies the user's `completionThreshold` preference the
 * same way `PlayerSectionsTab.vue` does (#596). Before this fix the
 * threshold was only wired into the player's sidebar — watch a lesson past
 * threshold and it read "completed" there, "in-progress" one click away on
 * the course page, with nothing else in the product (`courseState`, "Your
 * week") agreeing with either display.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { SectionOutline } from '@app/api-client-ts';

import CourseSectionsList from '../CourseSectionsList.vue';
import type * as PreferencesModule from '~/stores/preferences';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('~/composables/useSectionHeaderLabels', () => ({
  useSectionHeaderLabels: () => ({
    sectionLabel: (n: number) => `Section ${String(n)}`,
    formatLessons: (n: number) => `${String(n)} lessons`,
    formatDuration: (s: number) => `${String(s)}s`,
  }),
}));

// Real `effectiveLessonState` — only the store hook itself is stubbed, so the
// pure threshold logic under test stays real.
let completionThreshold = 90;
vi.mock('~/stores/preferences', async (importOriginal) => {
  const actual = await importOriginal<typeof PreferencesModule>();
  return {
    ...actual,
    usePreferencesStore: () => ({ completionThreshold }),
  };
});

vi.mock('@app/ui', () => ({
  AppSectionHeader: { props: ['idx', 'title'], template: '<div><slot /></div>' },
  AppLessonRow: {
    props: ['num', 'title', 'state', 'progress', 'to'],
    template: '<div class="fake-lesson-row" :data-state="state" :data-num="num" :data-to="to" />',
  },
}));

function section(overrides: Partial<SectionOutline> = {}): SectionOutline {
  return {
    id: 's1',
    position: 1,
    title: 'Section 1',
    totalDurationSeconds: 600,
    lessons: [
      {
        id: 'l1',
        position: 1,
        title: 'Lesson 1',
        durationSeconds: 300,
        hasMaterials: false,
        hasTranscript: false,
        state: 'in-progress',
        progressPercent: 80,
      },
    ],
    ...overrides,
  } as SectionOutline;
}

function mountList(sections: SectionOutline[]) {
  return mount(CourseSectionsList, {
    props: { sections, currentLessonId: 'l1', courseId: 'course-1' },
  });
}

describe('CourseSectionsList', () => {
  it('promotes an in-progress lesson to completed once the threshold is cleared', () => {
    completionThreshold = 70;
    const wrapper = mountList([section()]);
    expect(wrapper.find('.fake-lesson-row').attributes('data-state')).toBe('completed');
  });

  it('leaves the lesson in-progress when the threshold is not cleared', () => {
    completionThreshold = 90;
    const wrapper = mountList([section()]);
    expect(wrapper.find('.fake-lesson-row').attributes('data-state')).toBe('in-progress');
  });

  // #780 — the lesson row must carry a real route, not just a click handler.
  it('builds each lesson row route from courseId and lesson id', () => {
    const wrapper = mountList([section()]);
    expect(wrapper.find('.fake-lesson-row').attributes('data-to')).toBe(
      '/courses/course-1/lessons/l1',
    );
  });
});

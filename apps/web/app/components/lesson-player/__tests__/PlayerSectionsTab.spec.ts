/**
 * Spec for PlayerSectionsTab.
 *
 * Covers the one piece of non-trivial logic in this file: applying the
 * user's `completionThreshold` preference on top of the outline's raw
 * server-truth `state` before handing it to AppLessonRow (issue #565 — the
 * threshold had no consumer at all before this).
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { SectionOutline } from '@app/api-client-ts';

import PlayerSectionsTab from '../PlayerSectionsTab.vue';
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
    props: ['num', 'title', 'state', 'progress'],
    template: '<div class="fake-lesson-row" :data-state="state" :data-num="num" />',
  },
}));

const globalStubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
};

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

function mountTab(sections: SectionOutline[]) {
  return mount(PlayerSectionsTab, {
    props: { sections, courseId: 'c1', currentLessonId: 'l1' },
    global: { stubs: globalStubs },
  });
}

describe('PlayerSectionsTab', () => {
  it('promotes an in-progress lesson to completed once the threshold is cleared', () => {
    completionThreshold = 70;
    const wrapper = mountTab([section()]);
    expect(wrapper.find('.fake-lesson-row').attributes('data-state')).toBe('completed');
  });

  it('leaves the lesson in-progress when the threshold is not cleared', () => {
    completionThreshold = 90;
    const wrapper = mountTab([section()]);
    expect(wrapper.find('.fake-lesson-row').attributes('data-state')).toBe('in-progress');
  });
});

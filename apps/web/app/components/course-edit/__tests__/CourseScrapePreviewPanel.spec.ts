/**
 * Spec for CourseScrapePreviewPanel (E30-F03-S01).
 *
 * Covers the card's per-field-apply acceptance: clicking "Apply" on one row
 * writes exactly that field via `setField` and touches no neighbour — a
 * blanket "accept all" is explicitly not the feature.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseFormState } from '~/composables/useCourseEdit';
import type { ScrapeCandidateDto } from '@app/api-client-ts';
import CourseScrapePreviewPanel from '../CourseScrapePreviewPanel.vue';

vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));

const mockRun = vi.fn();
const candidatesRef = ref<ScrapeCandidateDto[]>([]);
const statusRef = ref<'idle' | 'pending' | 'success' | 'error'>('idle');

vi.mock('~/composables/useCourseScrapePreview', () => ({
  useCourseScrapePreview: () => ({
    candidates: candidatesRef,
    status: statusRef,
    scrapers: ref([]),
    run: mockRun,
  }),
}));

vi.mock('@app/ui', () => ({
  AppField: { name: 'AppField', props: ['label'], template: '<div><slot v-bind="{}" /></div>' },
  AppTextField: {
    name: 'AppTextField',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template:
      '<input :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppSelect: {
    name: 'AppSelect',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<select />',
  },
  AppSegmented: {
    name: 'AppSegmented',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div><slot /></div>',
  },
  AppSegmentedItem: { name: 'AppSegmentedItem', props: ['value', 'label'], template: '<button />' },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
}));

function makeForm(overrides: Partial<CourseFormState> = {}): CourseFormState {
  return {
    title: 'Current Title',
    description: 'Current description',
    slug: 'current-slug',
    level: null,
    language: '',
    releaseDate: '',
    posterUrl: '',
    ratingAverage: null,
    ratingCount: null,
    instructorIds: [],
    studioIds: [],
    tagIds: [],
    externalIds: [],
    sourceUpdatedAt: '',
    ...overrides,
  };
}

describe('CourseScrapePreviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    candidatesRef.value = [];
    statusRef.value = 'idle';
  });

  it('applies only the field that was clicked, leaving every other field untouched', async () => {
    candidatesRef.value = [
      {
        source: 'coursera',
        fragment: { title: 'Candidate Title', description: 'Candidate description' },
      },
    ];
    statusRef.value = 'success';

    const setField = vi.fn();
    const setRating = vi.fn();

    const wrapper = mount(CourseScrapePreviewPanel, {
      props: { courseId: 'course-1', form: makeForm(), setField, setRating },
    });

    // Row order per rowsFor(): title, description, level, language,
    // releaseDate, posterUrl, rating, externalIds. Only title/description
    // carry a candidate value, so only their Apply buttons are enabled.
    const applyButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseEdit.scrapePreview.apply');

    await applyButton!.trigger('click');

    expect(setField).toHaveBeenCalledTimes(1);
    expect(setField).toHaveBeenCalledWith('title', 'Candidate Title');
    expect(setRating).not.toHaveBeenCalled();
  });

  it('disables Apply for a field the candidate did not provide', () => {
    candidatesRef.value = [{ source: 'coursera', fragment: { title: 'Candidate Title' } }];
    statusRef.value = 'success';

    const wrapper = mount(CourseScrapePreviewPanel, {
      props: { courseId: 'course-1', form: makeForm(), setField: vi.fn(), setRating: vi.fn() },
    });

    const applyButtons = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'pages.courseEdit.scrapePreview.apply');

    // title (0) has a candidate value; description (1) does not.
    expect(applyButtons[0]!.attributes('disabled')).toBeUndefined();
    expect(applyButtons[1]!.attributes('disabled')).toBeDefined();
  });
});

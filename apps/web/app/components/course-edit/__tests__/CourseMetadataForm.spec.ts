/**
 * Spec for CourseMetadataForm (E30-F03-S01).
 *
 * Covers the two partial-update semantics the card names explicitly: a
 * field edited alone sends only that field, and an untouched form sends
 * nothing at all (no `submit` emit, so the page never calls `updateCourse`).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseDto } from '@app/api-client-ts';
import CourseMetadataForm from '../CourseMetadataForm.vue';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));

// ── Child composables the form pulls in ───────────────────────────────────
vi.mock('~/composables/useEntitySearch', () => ({
  useEntitySearch: () => ({ searchTerm: ref(''), items: ref([]), loading: ref(false) }),
  fetchInstructorOptions: vi.fn(),
  fetchStudioOptions: vi.fn(),
  fetchTagOptions: vi.fn(),
}));

// ── @app/ui stubs — thin enough to drive via setValue/emit, nothing more ──
vi.mock('@app/ui', () => ({
  AppField: { name: 'AppField', props: ['label'], template: '<div><slot v-bind="{}" /></div>' },
  AppTextField: {
    name: 'AppTextField',
    props: ['modelValue', 'label', 'required', 'error', 'help', 'placeholder', 'disabled', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppTextarea: {
    name: 'AppTextarea',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppInput: {
    name: 'AppInput',
    props: ['modelValue', 'type'],
    emits: ['update:modelValue'],
    template:
      '<input :type="type" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppSelect: {
    name: 'AppSelect',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option></select>',
  },
  AppNumberField: {
    name: 'AppNumberField',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template:
      '<input type="number" :aria-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value === \'\' ? null : Number($event.target.value))" />',
  },
  AppButton: {
    name: 'AppButton',
    props: ['type', 'variant', 'label', 'disabled', 'loading'],
    template: '<button :type="type || \'button\'" :disabled="disabled">{{ label }}</button>',
  },
  AppIconButton: {
    name: 'AppIconButton',
    props: ['name', 'ariaLabel', 'disabled'],
    emits: ['click'],
    template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')" />',
  },
}));

function makeCourse(overrides: Partial<CourseDto> = {}): CourseDto {
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'intro-to-testing',
    title: 'Intro to Testing',
    description: 'A course.',
    sections: [],
    progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
    instructors: [],
    studios: [],
    tags: [],
    level: 'beginner',
    language: 'en',
    releaseDate: '2024-01-01',
    posterUrl: '',
    ratingAverage: null,
    ratingCount: null,
    externalIds: [],
    sourceUpdatedAt: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  } as CourseDto;
}

function mountForm() {
  return mount(CourseMetadataForm, {
    props: { course: makeCourse(), saving: false },
    global: { stubs: { CourseScrapePreviewPanel: true } },
  });
}

describe('CourseMetadataForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends nothing when the form is submitted untouched', async () => {
    const wrapper = mountForm();
    await wrapper.find('form').trigger('submit');
    expect(wrapper.emitted('submit')).toBeUndefined();
  });

  it('sends only the one field the admin edited', async () => {
    const wrapper = mountForm();

    await wrapper.find('[aria-label="pages.courseEdit.fields.title"]').setValue('New Title');
    await wrapper.find('form').trigger('submit');

    const submitted = wrapper.emitted('submit');
    expect(submitted).toHaveLength(1);
    expect(submitted?.[0]?.[0]).toEqual({ title: 'New Title' });
  });

  it('emits cancel when the Cancel button is clicked', async () => {
    const wrapper = mountForm();
    const buttons = wrapper.findAll('button');
    const cancelBtn = buttons.find((b) => b.text() === 'pages.courseEdit.cancelCta');
    await cancelBtn!.trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });
});

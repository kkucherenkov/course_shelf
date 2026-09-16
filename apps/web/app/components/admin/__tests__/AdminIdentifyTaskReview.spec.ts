/**
 * Spec for AdminIdentifyTaskReview component (E30-F03-S02).
 *
 * Covers the card's acceptance directly at the component boundary: a
 * per-field mode change is carried into the emitted `apply` payload with
 * every other field still explicit (never omitted); discard emits discard,
 * never apply; a task that is no longer `proposed` renders every field
 * read-only, sourced from the task's own stored policy.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { CourseDto, IdentifyTaskDto } from '@app/api-client-ts';
import { MERGE_POLICY_FIELDS } from '~/composables/useIdentifyTasks';
import AdminIdentifyTaskReview from '../AdminIdentifyTaskReview.vue';

vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));

vi.mock('@app/ui', () => ({
  AppBadge: {
    name: 'AppBadge',
    props: ['label', 'color'],
    template: '<span class="stub-badge">{{ label }}</span>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['type', 'variant', 'label', 'loading', 'disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  // Stand-in that preserves the real contract (v-model-ish `modelValue` +
  // `update:modelValue`) without the provide/inject wiring of the real
  // AppSegmented/AppSegmentedItem pair — a native <select> is an equally
  // valid probe for "did the panel react to a picked mode".
  AppSegmented: {
    name: 'AppSegmented',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
  },
  AppSegmentedItem: {
    name: 'AppSegmentedItem',
    props: ['value', 'label'],
    template: '<option :value="value">{{ label }}</option>',
  },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'description'],
    template:
      '<div v-if="open" class="stub-dialog">{{ title }} — {{ description }}<slot /><slot name="footer" /></div>',
  },
}));

function makeTask(overrides: Partial<IdentifyTaskDto> = {}): IdentifyTaskDto {
  return {
    id: 'task-1',
    courseId: 'course-1',
    status: 'proposed',
    source: 'coursera',
    scrapedFragment: { title: 'Scraped Title' },
    mergePolicy: {},
    createdAt: '2026-09-15T00:00:00.000Z',
    ...overrides,
  } as IdentifyTaskDto;
}

const course: CourseDto = {
  id: 'course-1',
  libraryId: 'lib-1',
  slug: 'intro',
  title: 'Current Title',
  sections: [],
  progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
  createdAt: '',
  updatedAt: '',
} as CourseDto;

describe('AdminIdentifyTaskReview', () => {
  it('renders one mode control per MergePolicyDto field for a proposed task', () => {
    const wrapper = mount(AdminIdentifyTaskReview, {
      props: { task: makeTask(), course, applying: false, discarding: false },
    });
    expect(wrapper.findAll('select')).toHaveLength(MERGE_POLICY_FIELDS.length);
  });

  it('carries a per-field mode change into the emitted apply payload, every other field explicit', async () => {
    const wrapper = mount(AdminIdentifyTaskReview, {
      props: { task: makeTask(), course, applying: false, discarding: false },
    });

    // Row order matches MERGE_POLICY_FIELDS — 'title' is first.
    await wrapper.findAll('select')[0]!.setValue('ignore');
    const applyButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.admin.identifyTaskDetail.applyCta');
    await applyButton!.trigger('click');
    // Apply is gated behind a confirmation dialog (#606) — nothing is
    // emitted until it's confirmed.
    expect(wrapper.emitted('apply')).toBeFalsy();
    const confirmButton = wrapper
      .findAll('.stub-dialog button')
      .find((b) => b.text() === 'pages.admin.identifyTaskDetail.applyDialogConfirm');
    await confirmButton!.trigger('click');

    const emitted = wrapper.emitted('apply');
    expect(emitted).toBeTruthy();
    const policy = emitted![0]![0] as Record<string, string>;
    expect(policy.title).toBe('ignore');
    expect(Object.keys(policy)).toHaveLength(MERGE_POLICY_FIELDS.length);
    for (const field of MERGE_POLICY_FIELDS) {
      if (field !== 'title') expect(policy[field]).toBe('merge');
    }
  });

  it('asks for confirmation before applying, naming how many fields will change', async () => {
    // Only 'title' has scraped data in `makeTask()`'s fragment — every other
    // field's candidate is null, so it doesn't count even at the default
    // 'merge' mode.
    const wrapper = mount(AdminIdentifyTaskReview, {
      props: { task: makeTask(), course, applying: false, discarding: false },
    });

    const applyButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.admin.identifyTaskDetail.applyCta');
    await applyButton!.trigger('click');

    const dialog = wrapper.find('.stub-dialog');
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain('pages.admin.identifyTaskDetail.applyDialogTitle');
    expect(dialog.text()).toContain('pages.admin.identifyTaskDetail.applyDialogBody');

    // Cancel leaves the task untouched.
    const cancelButton = wrapper
      .findAll('.stub-dialog button')
      .find((b) => b.text() === 'pages.admin.identifyTaskDetail.applyDialogCancel');
    await cancelButton!.trigger('click');
    expect(wrapper.find('.stub-dialog').exists()).toBe(false);
    expect(wrapper.emitted('apply')).toBeFalsy();
  });

  it('discard emits discard and never apply', async () => {
    const wrapper = mount(AdminIdentifyTaskReview, {
      props: { task: makeTask(), course, applying: false, discarding: false },
    });

    const discardButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.admin.identifyTaskDetail.discardCta');
    await discardButton!.trigger('click');

    expect(wrapper.emitted('discard')).toBeTruthy();
    expect(wrapper.emitted('apply')).toBeFalsy();
  });

  it('renders read-only, sourced from the task’s own policy, once applied', () => {
    const wrapper = mount(AdminIdentifyTaskReview, {
      props: {
        task: makeTask({ status: 'applied', mergePolicy: { title: 'overwrite' } }),
        course,
        applying: false,
        discarding: false,
      },
    });

    expect(wrapper.findAll('select')).toHaveLength(0);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).toContain('pages.admin.identifyTaskDetail.mode.overwrite');
  });
});

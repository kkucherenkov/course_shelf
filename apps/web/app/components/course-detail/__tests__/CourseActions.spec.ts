/**
 * Spec for CourseActions' confirmation policy (#606, audit-regressions half).
 *
 * "Reset progress" was the only action in the product gated by a confirm
 * dialog, despite being fully reversible (rewatch undoes it) and touching
 * only the actor's own data. Per the confirm-when rule adopted this wave
 * (data belongs to someone else, is irreversible without manual recovery, or
 * costs machine time) it doesn't qualify — the click fires the mutation
 * directly, the same as "Mark complete" already does.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import CourseActions from '../CourseActions.vue';

vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to', 'variant', 'size', 'iconLeading', 'disabled', 'loading'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'title', 'description'],
    emits: ['update:open'],
    template: '<dialog v-if="open" open><slot /><slot name="footer" /></dialog>',
  },
}));

const baseProps = {
  courseState: 'in-progress' as const,
  primaryLabel: 'Resume',
  primaryHref: '/courses/c1/lessons/l1',
  markCompleteLabel: 'Mark complete',
  resetProgressLabel: 'Reset progress',
};

describe('CourseActions — reset progress', () => {
  it('fires resetProgress directly on click, with no confirm dialog', async () => {
    const wrapper = mount(CourseActions, { props: baseProps });

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Reset progress')!
      .trigger('click');

    expect(wrapper.emitted('resetProgress')).toEqual([[]]);
    // No dialog markup left over — AppDialog is gone entirely, not just closed.
    expect(wrapper.find('dialog').exists()).toBe(false);
  });

  it('disables reset progress for a not-started course, same as before', () => {
    const wrapper = mount(CourseActions, { props: { ...baseProps, courseState: 'not-started' } });
    const button = wrapper.findAll('button').find((b) => b.text() === 'Reset progress');
    expect((button!.element as HTMLButtonElement).disabled).toBe(true);
  });
});

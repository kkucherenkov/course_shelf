/**
 * Spec for CourseActions' own confirmation policy (#606, #624).
 *
 * This component never shows a confirm dialog itself — both "Mark complete"
 * and "Reset progress" emit straight through on click. `pages/courses/[id]
 * .vue` is the one that gates `resetProgress` behind a confirm dialog before
 * calling the mutation (#624 restored it after a previous wave removed it on
 * the mistaken claim that resetting is "fully reversible by rewatching" —
 * see that page's spec for the confirm-dialog coverage). This file only
 * covers CourseActions' own behaviour: it always emits, never blocks.
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
  it('fires resetProgress directly on click — no confirm dialog in this component', async () => {
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

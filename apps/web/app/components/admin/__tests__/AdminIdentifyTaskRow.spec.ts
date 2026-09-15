/**
 * Spec for AdminIdentifyTaskRow component (E30-F03-S02).
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { IdentifyTaskDto } from '@app/api-client-ts';
import AdminIdentifyTaskRow from '../AdminIdentifyTaskRow.vue';

vi.mock('@app/ui', () => ({
  AppBadge: {
    name: 'AppBadge',
    props: ['label', 'color', 'size'],
    template: '<span class="stub-badge">{{ label }}</span>',
  },
}));

function makeTask(overrides: Partial<IdentifyTaskDto> = {}): IdentifyTaskDto {
  return {
    id: 'task-1',
    courseId: 'course-abcdefgh1234',
    status: 'proposed',
    source: 'coursera',
    scrapedFragment: { title: 'Scraped Title' },
    mergePolicy: {},
    createdAt: new Date().toISOString(),
    ...overrides,
  } as IdentifyTaskDto;
}

const baseProps = {
  task: makeTask(),
  labelProposed: 'Proposed',
  labelApplied: 'Applied',
  labelDiscarded: 'Discarded',
};

describe('AdminIdentifyTaskRow', () => {
  it('renders the task source and status label', () => {
    const wrapper = mount(AdminIdentifyTaskRow, { props: baseProps });
    expect(wrapper.text()).toContain('coursera');
    expect(wrapper.text()).toContain('Proposed');
  });

  it('renders the applied/discarded labels for their statuses', () => {
    const applied = mount(AdminIdentifyTaskRow, {
      props: { ...baseProps, task: makeTask({ status: 'applied' }) },
    });
    expect(applied.text()).toContain('Applied');

    const discarded = mount(AdminIdentifyTaskRow, {
      props: { ...baseProps, task: makeTask({ status: 'discarded' }) },
    });
    expect(discarded.text()).toContain('Discarded');
  });

  it('emits click when the row is activated', async () => {
    const wrapper = mount(AdminIdentifyTaskRow, { props: baseProps });
    await wrapper.find('.adm-identify-row').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});

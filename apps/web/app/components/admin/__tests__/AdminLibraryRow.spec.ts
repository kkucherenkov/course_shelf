/**
 * Spec for AdminLibraryRow component.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { AdminLibraryListItem } from '@app/api-client-ts';
import AdminLibraryRow from '../AdminLibraryRow.vue';

// Stub the AdminCopyablePath child to avoid clipboard API in tests
vi.mock('../AdminCopyablePath.vue', () => ({
  default: {
    name: 'AdminCopyablePath',
    props: ['path', 'ariaLabel'],
    template: '<button class="stub-copyable-path">{{ path }}</button>',
  },
}));

const baseLibrary: AdminLibraryListItem = {
  id: 'lib-1',
  name: 'Computer Science',
  rootPath: '/srv/courses/cs',
  coursesCount: 12,
  lessonsCount: 144,
  lastScan: null,
};

const baseProps = {
  library: baseLibrary,
  courseCountLabel: '12 courses',
  lastScanNeverLabel: 'Never scanned',
  lastScanLabel: 'Last scan {time}',
  scanCtaLabel: 'Scan',
  moreCtaLabel: 'More',
  copyPathAriaLabel: 'Copy path',
  labelRunning: 'Running',
  labelSucceeded: 'Succeeded',
  labelFailed: 'Failed',
  labelCancelled: 'Cancelled',
};

describe('AdminLibraryRow', () => {
  it('renders library name', () => {
    const wrapper = mount(AdminLibraryRow, { props: baseProps });
    expect(wrapper.text()).toContain('Computer Science');
  });

  it('shows "never scanned" label when no lastScan', () => {
    const wrapper = mount(AdminLibraryRow, { props: baseProps });
    expect(wrapper.text()).toContain('Never scanned');
  });

  it('shows status pill with succeeded label when scan succeeded', () => {
    const wrapper = mount(AdminLibraryRow, {
      props: {
        ...baseProps,
        library: {
          ...baseLibrary,
          lastScan: {
            status: 'succeeded',
            startedAt: new Date(Date.now() - 60_000).toISOString(),
            finishedAt: new Date().toISOString(),
            errorsCount: 0,
          },
        },
      },
    });
    expect(wrapper.text()).toContain('Succeeded');
  });

  it('emits click when row is clicked', async () => {
    const wrapper = mount(AdminLibraryRow, { props: baseProps });
    await wrapper.find('.adm-lib-row').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });

  it('emits scan when Scan button is clicked (does not bubble click)', async () => {
    const wrapper = mount(AdminLibraryRow, { props: baseProps });
    // Find the scan button (md+ variant)
    const scanBtn = wrapper.find('.adm-lib-row__btn--md-up');
    await scanBtn.trigger('click');
    expect(wrapper.emitted('scan')).toBeTruthy();
    // click event should NOT be emitted (stopPropagation)
    expect(wrapper.emitted('click')).toBeFalsy();
  });

  it('matches snapshot', () => {
    const wrapper = mount(AdminLibraryRow, { props: baseProps });
    expect(wrapper.html()).toMatchSnapshot();
  });
});

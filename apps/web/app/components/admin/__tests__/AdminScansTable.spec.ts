/**
 * Spec for AdminScansTable component.
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { AdminScanListItem } from '@app/api-client-ts';
import AdminScansTable from '../AdminScansTable.vue';

const baseProps = {
  items: [] as AdminScanListItem[],
  loading: false,
  colStatus: 'Status',
  colStarted: 'Started',
  colDuration: 'Duration',
  colFiles: 'Files',
  colAdded: 'Added',
  colErrors: 'Errors',
  labelRunning: 'Running',
  labelSucceeded: 'Succeeded',
  labelFailed: 'Failed',
  labelCancelled: 'Cancelled',
};

const sampleItems: AdminScanListItem[] = [
  {
    scanId: 'scan-1',
    libraryId: 'lib-1',
    libraryName: 'Computer Science',
    status: 'succeeded',
    startedAt: new Date(Date.now() - 3_600_000).toISOString(),
    finishedAt: new Date(Date.now() - 3_540_000).toISOString(),
    filesScanned: 200,
    coursesAdded: 5,
    errorsCount: 0,
  },
  {
    scanId: 'scan-2',
    libraryId: 'lib-2',
    libraryName: 'Mathematics',
    status: 'failed',
    startedAt: new Date(Date.now() - 7_200_000).toISOString(),
    finishedAt: new Date(Date.now() - 7_140_000).toISOString(),
    filesScanned: 50,
    coursesAdded: 0,
    errorsCount: 3,
  },
];

describe('AdminScansTable', () => {
  it('renders skeleton when loading=true', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, loading: true },
    });
    expect(wrapper.find('.adm-scans-tbl__skeleton-wrap').exists()).toBe(true);
    expect(wrapper.find('.adm-scans-tbl__wrap').exists()).toBe(false);
  });

  it('renders table when loading=false', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    expect(wrapper.find('.adm-scans-tbl').exists()).toBe(true);
  });

  it('renders a row for each item', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    const rows = wrapper.findAll('.adm-scans-tbl__row');
    expect(rows).toHaveLength(2);
  });

  it('shows status labels', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    expect(wrapper.text()).toContain('Succeeded');
    expect(wrapper.text()).toContain('Failed');
  });

  it('shows column headers', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    expect(wrapper.text()).toContain('Status');
    expect(wrapper.text()).toContain('Duration');
  });

  it('shows library column when showLibrary=true', () => {
    const wrapper = mount(AdminScansTable, {
      props: {
        ...baseProps,
        items: sampleItems,
        showLibrary: true,
        colLibrary: 'Library',
      },
    });
    expect(wrapper.text()).toContain('Library');
    expect(wrapper.text()).toContain('Computer Science');
  });

  it('matches snapshot (empty state)', () => {
    const wrapper = mount(AdminScansTable, { props: baseProps });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('matches snapshot (with items)', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});

/**
 * Spec for AdminScansTable component.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { AdminScanListItem } from '@app/api-client-ts';
import AdminScansTable from '../AdminScansTable.vue';

// Mirrors the real `t(key, count, { named: { n: count } })` plural call
// shape, so a fall-back to hardcoded English (the pre-#620 `formatRelative`)
// is visible as a raw locale key instead of "d ago".
vi.stubGlobal('useI18n', () => ({
  t: (key: string, ...args: unknown[]) => {
    const opts = args.find((a) => typeof a === 'object' && a !== null) as
      | { named?: { n?: unknown } }
      | undefined;
    return opts?.named?.n === undefined ? key : `${key}:${String(opts.named.n)}`;
  },
}));

vi.mock('@app/ui', () => ({
  IconCS: {
    name: 'IconCS',
    props: ['name', 'size'],
    template: '<svg class="stub-icon" :data-name="name" />',
  },
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height', 'radius'], template: '<span />' },
}));

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
  labelPartial: 'Partial',
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

  it('formats "started" through i18n, not hardcoded English "ago"', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    expect(wrapper.text()).toContain('ui.noteEditor.agoHours:1');
    expect(wrapper.text()).not.toMatch(/\d+[smhd] ago/);
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

  it('renders errorsCount as a plain number when no scan is expandable (#620)', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems },
    });
    expect(wrapper.find('.adm-scans-tbl__errors-btn').exists()).toBe(false);
    expect(wrapper.text()).toContain('3');
  });

  it('renders errorsCount as a button only for the row matching expandableScanId (#620)', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems, expandableScanId: 'scan-2' },
    });
    const buttons = wrapper.findAll('.adm-scans-tbl__errors-btn');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.text()).toBe('3');
  });

  it('does not turn a zero-error row into a button even if it is the expandable scan', () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems, expandableScanId: 'scan-1' },
    });
    expect(wrapper.find('.adm-scans-tbl__errors-btn').exists()).toBe(false);
  });

  it('emits toggle-errors with the scanId when the errors button is clicked', async () => {
    const wrapper = mount(AdminScansTable, {
      props: { ...baseProps, items: sampleItems, expandableScanId: 'scan-2' },
    });
    await wrapper.find('.adm-scans-tbl__errors-btn').trigger('click');
    expect(wrapper.emitted('toggle-errors')).toEqual([['scan-2']]);
  });

  it('reflects expandedScanId as aria-expanded on the errors button', () => {
    const wrapper = mount(AdminScansTable, {
      props: {
        ...baseProps,
        items: sampleItems,
        expandableScanId: 'scan-2',
        expandedScanId: 'scan-2',
      },
    });
    expect(wrapper.find('.adm-scans-tbl__errors-btn').attributes('aria-expanded')).toBe('true');
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

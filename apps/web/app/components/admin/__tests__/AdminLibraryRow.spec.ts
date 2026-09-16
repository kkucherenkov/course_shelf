/**
 * Spec for AdminLibraryRow component.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { AdminLibraryListItem } from '@app/api-client-ts';
import AdminLibraryRow from '../AdminLibraryRow.vue';

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

// Stub the AdminCopyablePath child to avoid clipboard API in tests
vi.mock('../AdminCopyablePath.vue', () => ({
  default: {
    name: 'AdminCopyablePath',
    props: ['path', 'ariaLabel'],
    template: '<button class="stub-copyable-path">{{ path }}</button>',
  },
}));

vi.mock('@app/ui', () => ({
  IconCS: {
    name: 'IconCS',
    props: ['name', 'size'],
    template: '<svg class="stub-icon" :data-name="name" />',
  },
  AppIconButton: {
    name: 'AppIconButton',
    props: ['name', 'ariaLabel', 'variant', 'size', 'disabled'],
    emits: ['click'],
    template: '<button :aria-label="ariaLabel" @click="$emit(\'click\')" />',
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

  it('formats last-scan time through i18n, not hardcoded English "ago"', () => {
    const wrapper = mount(AdminLibraryRow, {
      props: {
        ...baseProps,
        library: {
          ...baseLibrary,
          lastScan: {
            status: 'succeeded',
            startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            finishedAt: new Date().toISOString(),
            errorsCount: 0,
          },
        },
      },
    });
    expect(wrapper.text()).toContain('ui.noteEditor.agoHours:2');
    expect(wrapper.text()).not.toMatch(/\d+[smhd] ago/);
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

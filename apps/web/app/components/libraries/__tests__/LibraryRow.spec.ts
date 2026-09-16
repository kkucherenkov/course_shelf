/**
 * Spec for LibraryRow.vue (#595).
 *
 * A failed rescan (403 for a non-admin, or any other server error) used to
 * be swallowed by an empty `catch` whose comment claimed the composable's
 * `error` ref covered it — nothing ever rendered that ref. This asserts the
 * user actually sees something when the trigger fails.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import type { LibraryDto } from '@app/api-client-ts';

vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
const mockToastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: mockToastAdd }));

const mockTriggerScan = vi.fn();
vi.mock('~/composables/useLibraries', () => ({
  useLatestScan: () => ({
    data: ref(null),
    status: ref('success'),
    error: ref(null),
    refresh: vi.fn(),
    triggerScan: mockTriggerScan,
  }),
}));

vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'loading', 'disabled'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppChip: { name: 'AppChip', template: '<span />' },
  IconCS: { name: 'IconCS', template: '<i />' },
}));

const LIBRARY: LibraryDto = {
  id: 'lib-1',
  name: 'Conference Recordings',
  rootPath: '/srv/courses/conference',
  createdAt: '2026-04-25T09:00:00Z',
  updatedAt: '2026-04-25T09:00:00Z',
};

async function mountRow() {
  const mod = await import('../LibraryRow.vue');
  return mount(mod.default, { props: { library: LIBRARY } });
}

describe('LibraryRow.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toasts an error when the rescan trigger fails', async () => {
    mockTriggerScan.mockRejectedValueOnce(new Error('Failed to start scan'));
    const wrapper = await mountRow();

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(mockToastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ color: 'error', title: 'notifiers.scan.statusFailed' }),
    );
  });

  it('does not toast when the rescan succeeds', async () => {
    mockTriggerScan.mockResolvedValueOnce(undefined);
    const wrapper = await mountRow();

    await wrapper.find('button').trigger('click');
    await wrapper.vm.$nextTick();
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(mockToastAdd).not.toHaveBeenCalled();
  });
});

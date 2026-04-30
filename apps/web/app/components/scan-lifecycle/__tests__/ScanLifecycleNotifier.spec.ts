/**
 * Snapshot + behaviour spec for ScanLifecycleNotifier.
 *
 * Mounts the component with controlled store states:
 *  - no active scans
 *  - one active (running) scan
 *  - one finished scan
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

// ── Stub @app/ui's AppScanProgress to a simple div ────────────────────────────

vi.mock('@app/ui', () => ({
  AppScanProgress: {
    name: 'AppScanProgress',
    props: [
      'status',
      'courseName',
      'percent',
      'elapsedTime',
      'scanned',
      'added',
      'updated',
      'errors',
      'scanningLabel',
      'successLabel',
      'failedLabel',
      'cancelLabel',
      'errorsLabel',
      'statScannedLabel',
      'statAddedLabel',
      'statUpdatedLabel',
      'statErrorsLabel',
    ],
    template: '<div class="stub-app-scan-progress" :data-status="status">{{ courseName }}</div>',
  },
}));

// ── Stub i18n and toast from #imports ─────────────────────────────────────────

vi.mock('#imports', () => ({
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  useI18n: () => ({
    t: (key: string) => key,
    n: String,
  }),
  useToast: () => ({ add: vi.fn() }),
}));

// ── Component under test ───────────────────────────────────────────────────────

import ScanLifecycleNotifier from '../../ScanLifecycleNotifier.vue';
import { useScanLifecycleStore } from '~/stores/scanLifecycle';

describe('ScanLifecycleNotifier', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders nothing when there are no scans', () => {
    const wrapper = mount(ScanLifecycleNotifier);
    expect(wrapper.find('.scan-lifecycle-notifier').exists()).toBe(false);
  });

  it('renders panel with one running scan card', async () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });

    const wrapper = mount(ScanLifecycleNotifier);
    await wrapper.vm.$nextTick();

    const card = wrapper.find('.stub-app-scan-progress');
    expect(card.exists()).toBe(true);
    expect(card.attributes('data-status')).toBe('running');
    expect(card.text()).toContain('CS Library');
  });

  it('does not show close button for running scan', async () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });

    const wrapper = mount(ScanLifecycleNotifier);
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.scan-lifecycle-notifier__close').exists()).toBe(false);
  });

  it('shows close button on finished scan', async () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });
    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
      status: 'succeeded',
      filesScanned: 100,
      filesAdded: 20,
      coursesDiscovered: 5,
      errorsCount: 0,
    });

    const wrapper = mount(ScanLifecycleNotifier);
    await wrapper.vm.$nextTick();

    const closeBtn = wrapper.find('.scan-lifecycle-notifier__close');
    expect(closeBtn.exists()).toBe(true);
  });

  it('calls store.dismiss when close button is clicked', async () => {
    const store = useScanLifecycleStore();
    const dismissSpy = vi.spyOn(store, 'dismiss');

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });
    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
      status: 'succeeded',
      filesScanned: 100,
      filesAdded: 20,
      coursesDiscovered: 5,
      errorsCount: 0,
    });

    const wrapper = mount(ScanLifecycleNotifier);
    await wrapper.vm.$nextTick();

    await wrapper.find('.scan-lifecycle-notifier__close').trigger('click');

    expect(dismissSpy).toHaveBeenCalledWith('scan-1');
  });

  it('maps finished/succeeded status to "success" for AppScanProgress', async () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });
    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
      status: 'succeeded',
      filesScanned: 100,
      filesAdded: 20,
      coursesDiscovered: 5,
      errorsCount: 0,
    });

    const wrapper = mount(ScanLifecycleNotifier);
    await wrapper.vm.$nextTick();

    const card = wrapper.find('.stub-app-scan-progress');
    expect(card.attributes('data-status')).toBe('success');
  });
});

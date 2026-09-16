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
      'elapsedTime',
      'scanned',
      'added',
      'updated',
      'errors',
      'scanningLabel',
      'successLabel',
      'failedLabel',
      'errorsLabel',
      'statScannedLabel',
      'statAddedLabel',
      'statUpdatedLabel',
      'statErrorsLabel',
    ],
    emits: ['errors-clicked'],
    template:
      '<div class="stub-app-scan-progress" :data-status="status"><button type="button" class="stub-errors-btn" @click="$emit(\'errors-clicked\')">{{ courseName }}</button></div>',
  },
}));

// ── Stub i18n, toast and navigation from #imports ─────────────────────────────

const navigateToMock = vi.fn();
const { toastAddSpy } = vi.hoisted(() => ({ toastAddSpy: vi.fn() }));

vi.mock('#imports', () => ({
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  navigateTo: (...args: unknown[]) => navigateToMock(...args),
  useI18n: () => ({
    // Mirrors the real `t(key, count, { named: { n: count } })` call shape
    // used for plurals — same as the page-level specs for this feature, so a
    // wrong plural index (#621) is visible in the returned string.
    t: (key: string, ...args: unknown[]) => {
      const opts = args.find((a) => typeof a === 'object' && a !== null) as
        | { named?: { n?: unknown } }
        | undefined;
      return opts?.named?.n === undefined ? key : `${key}:${String(opts.named.n)}`;
    },
    n: String,
  }),
  useToast: () => ({ add: toastAddSpy }),
}));

// ── Component under test ───────────────────────────────────────────────────────

import ScanLifecycleNotifier from '../../ScanLifecycleNotifier.vue';
import { useScanLifecycleStore } from '~/stores/scanLifecycle';

describe('ScanLifecycleNotifier', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    toastAddSpy.mockClear();
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

  it('navigates to the library admin page when the errors button is clicked (#593)', async () => {
    const store = useScanLifecycleStore();

    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });
    store.applyEvent({
      kind: 'progress',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
      filesScanned: 40,
      filesAdded: 5,
      coursesDiscovered: 1,
      errorsCount: 2,
    });

    const wrapper = mount(ScanLifecycleNotifier);
    await wrapper.vm.$nextTick();

    await wrapper.find('.stub-errors-btn').trigger('click');

    expect(navigateToMock).toHaveBeenCalledWith('/admin/libraries/lib-1');
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

  it('passes the real error count as the plural index on the failed toast (#621)', async () => {
    const store = useScanLifecycleStore();

    // The toast-on-finish watcher only fires on a *change* to `store.active`
    // after the component is mounted — applying both events up front (as
    // every other test in this file does) means the watcher's initial value
    // already includes the finished card and it never fires. Mount first,
    // then finish the scan.
    const wrapper = mount(ScanLifecycleNotifier);
    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });
    await wrapper.vm.$nextTick();
    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
      status: 'failed',
      filesScanned: 133,
      filesAdded: 0,
      coursesDiscovered: 0,
      errorsCount: 106,
    });
    await wrapper.vm.$nextTick();

    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'notifiers.scan.toastFailedSummary:106' }),
    );
  });

  it('splits the done toast into two independently-pluralized messages naming files, not lessons (#621)', async () => {
    const store = useScanLifecycleStore();

    const wrapper = mount(ScanLifecycleNotifier);
    store.applyEvent({
      kind: 'started',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
    });
    await wrapper.vm.$nextTick();
    store.applyEvent({
      kind: 'finished',
      scanId: 'scan-1',
      libraryId: 'lib-1',
      libraryName: 'CS Library',
      at: new Date().toISOString(),
      status: 'succeeded',
      filesScanned: 5973,
      filesAdded: 68,
      coursesDiscovered: 3,
      errorsCount: 0,
    });
    await wrapper.vm.$nextTick();

    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        description:
          'notifiers.scan.toastDoneSummaryCourses:3 · notifiers.scan.toastDoneSummaryFiles:68',
      }),
    );
  });
});

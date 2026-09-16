/**
 * Regression spec for pages/admin/libraries/[id].vue's live scan-progress
 * card (#593).
 *
 * Before this fix the card hardcoded `:added="0" :updated="0" :errors="0"`
 * regardless of what the poll actually returned — while `ScanLifecycleNotifier`
 * on the same screen rendered the real numbers for the same scan. This spec
 * only exercises the scan-progress wiring; everything else on the page is
 * stubbed.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed, watch } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import type { ScanDto } from '@app/api-client-ts';
import { runLibraryScan } from '@app/api-client-ts';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', vi.fn());
vi.stubGlobal('useI18n', () => ({
  // The page calls `t(key, count, { named: { n: count } })` for the errors
  // label — only that shape matters here.
  t: (key: string, ...args: unknown[]) => {
    const opts = args.find((a) => typeof a === 'object' && a !== null) as
      | { named?: { n?: unknown } }
      | undefined;
    return opts?.named?.n === undefined ? key : `${key}:${String(opts.named.n)}`;
  },
}));
vi.stubGlobal('useRoute', () => ({ params: { id: 'lib-1' } }));
const toastAddSpy = vi.fn();
vi.stubGlobal('useToast', () => ({ add: toastAddSpy }));
vi.stubGlobal('watch', watch);

vi.mock('@app/api-client-ts', () => ({ runLibraryScan: vi.fn(), client: {} }));

const UButtonStub = {
  name: 'UButton',
  props: ['label', 'loading', 'disabled', 'size', 'variant', 'color'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}<slot /></button>',
};

// ── Composables ─────────────────────────────────────────────────────────────

const librariesRef = ref({
  items: [
    {
      id: 'lib-1',
      name: 'CS Library',
      rootPath: '/srv/cs',
      coursesCount: 3,
      lessonsCount: 40,
      lastScan: null,
    },
  ],
});
vi.mock('~/composables/useAdminLibraries', () => ({
  useAdminLibraries: () => ({
    data: librariesRef,
    status: ref('success'),
    refetch: vi.fn(),
  }),
}));

vi.mock('~/composables/useAdminLibraryScans', () => ({
  useAdminLibraryScans: () => ({
    data: ref({ items: [] }),
    status: ref('success'),
    refetch: vi.fn(),
  }),
}));

vi.mock('~/composables/useCoursesList', () => ({
  useCoursesList: () => ({ data: ref({ items: [] }), status: ref('success') }),
}));

const liveScanRef = ref<ScanDto | null>(null);
vi.mock('~/composables/useScanProgress', () => ({
  useScanProgress: () => ({
    scan: liveScanRef,
    isRunning: computed(() => liveScanRef.value?.status === 'running'),
    elapsedTime: ref('00:00:05'),
    error: ref(null),
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

vi.mock('~/composables/useTranscriptionProgress', () => ({
  useTranscriptionProgress: () => ({
    transcription: ref(null),
    starting: ref(false),
    cancelling: ref(false),
    start: vi.fn(),
    cancel: vi.fn(),
  }),
}));

// ── @app/ui: only AppScanProgress needs real prop/event wiring ─────────────

vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', props: ['variant', 'title', 'body'], template: '<div />' },
  AppSpinner: { name: 'AppSpinner', props: ['size', 'label'], template: '<span />' },
  IconCS: { name: 'IconCS', props: ['name', 'size'], template: '<i />' },
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
      '<div class="stub-scan-progress" :data-added="added" :data-updated="updated" :data-errors="errors"><button type="button" class="stub-errors-btn" @click="$emit(\'errors-clicked\')">{{ errorsLabel }}</button></div>',
  },
}));

async function mountPage() {
  const mod = await import('../admin/libraries/[id].vue');
  return mount(mod.default, {
    global: {
      stubs: {
        AdminCopyablePath: true,
        AdminCourseList: true,
        AdminScansTable: true,
        AdminEditLibrarySheet: true,
        AdminRemoveLibraryDialog: true,
        AdminTranscriptionCard: true,
        UButton: UButtonStub,
        NuxtLink: true,
      },
    },
  });
}

function makeRunningScan(overrides: Partial<ScanDto> = {}): ScanDto {
  return {
    id: 'scan-1',
    libraryId: 'lib-1',
    status: 'running',
    startedAt: new Date().toISOString(),
    filesScanned: 500,
    filesAdded: 42,
    filesUpdated: 7,
    coursesDiscovered: 2,
    errors: [
      { path: 'a.mp4', message: 'unreadable' },
      { path: 'b.mp4', message: 'bad json' },
    ],
    ...overrides,
  };
}

describe('pages/admin/libraries/[id].vue — live scan progress card', () => {
  beforeEach(() => {
    liveScanRef.value = null;
    toastAddSpy.mockClear();
    vi.mocked(runLibraryScan).mockReset();
  });

  it('passes the real filesAdded/filesUpdated/errors counts, not hardcoded zeros (#593)', async () => {
    liveScanRef.value = makeRunningScan();
    const wrapper = await mountPage();

    const card = wrapper.find('.stub-scan-progress');
    expect(card.exists()).toBe(true);
    expect(card.attributes('data-added')).toBe('42');
    expect(card.attributes('data-updated')).toBe('7');
    expect(card.attributes('data-errors')).toBe('2');
  });

  it('reveals the real per-file error list when the errors button is clicked', async () => {
    liveScanRef.value = makeRunningScan();
    const wrapper = await mountPage();

    expect(wrapper.find('.adm-lib-detail__scan-errors').exists()).toBe(false);

    await wrapper.find('.stub-errors-btn').trigger('click');

    const list = wrapper.find('.adm-lib-detail__scan-errors');
    expect(list.exists()).toBe(true);
    expect(list.text()).toContain('a.mp4');
    expect(list.text()).toContain('unreadable');

    // Toggles closed again on a second click.
    await wrapper.find('.stub-errors-btn').trigger('click');
    expect(wrapper.find('.adm-lib-detail__scan-errors').exists()).toBe(false);
  });

  it('keeps the opened error list visible once the scan terminates (#620)', async () => {
    liveScanRef.value = makeRunningScan();
    const wrapper = await mountPage();

    await wrapper.find('.stub-errors-btn').trigger('click');
    expect(wrapper.find('.adm-lib-detail__scan-errors').exists()).toBe(true);

    // The scan finishes — `showScanProgress` (and the card that owns the
    // stub errors button) goes away, but the already-fetched `errors` array
    // is still sitting on `liveScan`. Before #620 the list was nested inside
    // the same `v-if="showScanProgress"` block as the card, so it vanished
    // here along with the card.
    liveScanRef.value = {
      ...liveScanRef.value!,
      status: 'succeeded',
      finishedAt: new Date().toISOString(),
    };
    await wrapper.vm.$nextTick();

    const list = wrapper.find('.adm-lib-detail__scan-errors');
    expect(list.exists()).toBe(true);
    expect(list.text()).toContain('a.mp4');
  });

  it('surfaces an error toast, not the CTA label, when the scan fails to start (#624)', async () => {
    vi.mocked(runLibraryScan).mockResolvedValueOnce({
      error: { message: 'Forbidden' },
    } as unknown as Awaited<ReturnType<typeof runLibraryScan>>);
    const wrapper = await mountPage();

    const scanNowBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.admin.libraryDetail.scanNowCta');
    expect(scanNowBtn).toBeTruthy();

    await scanNowBtn!.trigger('click');
    await flushPromises();

    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'pages.admin.libraryDetail.scanStartError',
        color: 'error',
      }),
    );
  });
});

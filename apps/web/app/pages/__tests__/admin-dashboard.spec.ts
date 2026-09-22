/**
 * Spec for apps/web/app/pages/admin/index.vue (#617).
 *
 * `statLibrariesMeta` used to call a locale key
 * (`pages.admin.dashboard.statLibrariesMeta`) that no longer exists in either
 * locale — a prior wave split it into `statLibrariesMetaCourses` /
 * `...Lessons` (two independent plural counts can't share one pipe-message)
 * but never updated the call site, so vue-i18n rendered the raw key path on
 * the live dashboard. The `t` stub below echoes `key(params)` so a test can
 * assert both split keys are actually called with the right counts, not just
 * that *a* string renders.
 *
 * `formatRelative` is covered too — it used to hardcode English `"Xs ago"`
 * literals instead of the already-translated `ui.noteEditor.ago*` keys
 * (`PlayerNotesTab.vue` established the pattern this page now reuses).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { AdminDashboardDto, AdminScanListDto } from '@app/api-client-ts';
import type { AdminDashboardStatus } from '~/composables/useAdminDashboard';
import type { AdminScansStatus } from '~/composables/useAdminScans';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}(${JSON.stringify(params)})` : key,
}));

// ── Composables under the page ──────────────────────────────────────────────
const dashData = ref<AdminDashboardDto | undefined>(undefined);
const dashStatus = ref<AdminDashboardStatus>('pending');
const dashError = ref<Error | null>(null);
const refetchDash = vi.fn();

const scansData = ref<AdminScanListDto | undefined>(undefined);
const scansStatus = ref<AdminScansStatus>('pending');
const scansError = ref<Error | null>(null);
const refetchScans = vi.fn();

vi.mock('~/composables/useAdminDashboard', () => ({
  useAdminDashboard: () => ({
    data: dashData,
    status: dashStatus,
    error: dashError,
    refetch: refetchDash,
  }),
}));
vi.mock('~/composables/useAdminScans', () => ({
  useAdminScans: () => ({
    data: scansData,
    status: scansStatus,
    error: scansError,
    refetch: refetchScans,
  }),
}));

// Real `useScanProgress` fires a network call the moment `libraryId` is
// non-empty (tuxedo 250's fix reuses it for whichever library owns the
// dashboard's `latestScan`) — stub it out the same way the other
// data-fetching composables above are stubbed, so this stays a page-logic
// unit test rather than an integration test against a live backend.
vi.mock('~/composables/useScanProgress', () => ({
  useScanProgress: () => ({
    scan: ref(null),
    isRunning: ref(false),
    elapsedTime: ref('00:00:00'),
    error: ref(null),
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

// ── @app/ui + child component stubs ─────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'title', 'body'],
    template: '<div class="stub-banner">{{ title }} {{ body }}<slot name="actions" /></div>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'size'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>',
  },
}));

// Neither child is this page's logic under test (AdminStatCard is a plain
// presenter; AdminScansTable belongs to the scan-surface lane) — thin stubs
// prove the props reach them without dragging in `IconCS`/etc.
vi.mock('~/components/admin/AdminStatCard.vue', () => ({
  default: {
    name: 'AdminStatCard',
    props: ['label', 'value', 'meta', 'error', 'loading'],
    template:
      '<div class="stub-stat-card" :data-label="label">{{ label }}: {{ value }} ({{ meta }}) loading={{ loading }} error={{ error }}</div>',
  },
}));
vi.mock('~/components/admin/AdminScansTable.vue', () => ({
  default: {
    name: 'AdminScansTable',
    props: ['items', 'loading', 'expandableScanId', 'expandedScanId', 'labelSucceededWithErrors'],
    template:
      '<div data-testid="scans-table" :data-expandable-scan-id="expandableScanId" :data-label-succeeded-with-errors="labelSucceededWithErrors">{{ items.length }} rows, loading={{ loading }}</div>',
  },
}));

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../admin/index.vue');
  return mount(mod.default);
}

const DASH: AdminDashboardDto = {
  generatedAt: '2026-09-16T00:00:00Z',
  counts: { libraries: 3, users: 12, courses: 68, lessons: 5973 },
  latestScan: {
    scanId: 'scan-1',
    libraryId: 'lib-abcdefgh-1234',
    status: 'succeeded',
    startedAt: '2026-09-16T00:00:00Z', // overridden per-test via Date mock
    finishedAt: '2026-09-16T00:01:00Z',
    filesScanned: 42,
    errorsCount: 0,
  },
  errorsLast24h: 0,
};

describe('admin dashboard page', () => {
  beforeEach(() => {
    dashData.value = undefined;
    dashStatus.value = 'pending';
    dashError.value = null;
    scansData.value = undefined;
    scansStatus.value = 'pending';
    scansError.value = null;
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('composes the split course/lesson keys instead of the deleted combined one', async () => {
    dashData.value = DASH;
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    // Proves both split keys are called with their own count, joined — not
    // the single dropped key that used to render as a raw path.
    expect(wrapper.text()).toContain('pages.admin.dashboard.statLibrariesMetaCourses({"n":68})');
    expect(wrapper.text()).toContain('pages.admin.dashboard.statLibrariesMetaLessons({"n":5973})');
    expect(wrapper.text()).not.toContain('pages.admin.dashboard.statLibrariesMeta(');
  });

  it('formats the last-scan time via the translated ago-keys, not a hardcoded English literal', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    dashData.value = { ...DASH, latestScan: { ...DASH.latestScan!, startedAt: twoHoursAgo } };
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('ui.noteEditor.agoHours({"n":2})');
    expect(wrapper.text()).not.toMatch(/\d+h ago/);
  });

  it('shows "never" copy when no scan has ever run', async () => {
    dashData.value = { ...DASH, latestScan: null };
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('pages.admin.dashboard.statLastScanNever');
  });

  it('names the last-scan library from the recent-scans join, not its raw cuid (#701)', async () => {
    dashData.value = DASH; // latestScan.scanId === 'scan-1', libraryId === 'lib-abcdefgh-1234'
    dashStatus.value = 'success';
    scansData.value = {
      items: [
        {
          scanId: 'scan-1',
          libraryId: 'lib-abcdefgh-1234',
          libraryName: 'Computer Science',
          status: 'succeeded',
          startedAt: '2026-09-16T00:00:00Z',
          finishedAt: '2026-09-16T00:01:00Z',
          filesScanned: 42,
          coursesAdded: 0,
          errorsCount: 0,
        },
      ],
    };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain(
      'pages.admin.dashboard.statLastScanMeta({"libraryName":"Computer Science","n":42})',
    );
    expect(wrapper.text()).not.toContain('lib-abcdefgh');
  });

  it('falls back to the truncated cuid when the recent-scans list has no matching row', async () => {
    dashData.value = DASH;
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(wrapper.text()).toContain(
      'pages.admin.dashboard.statLastScanMeta({"libraryName":"lib-abcd…","n":42})',
    );
  });

  it('shows the error banner and retries both sources on click', async () => {
    dashStatus.value = 'error';
    dashError.value = new Error('boom');
    scansStatus.value = 'success';
    scansData.value = { items: [] };

    const wrapper = await mountPage();

    expect(wrapper.find('.stub-banner').text()).toContain('boom');
    await wrapper.find('.stub-banner button').trigger('click');

    expect(refetchDash).toHaveBeenCalledOnce();
    expect(refetchScans).toHaveBeenCalledOnce();
  });

  it('passes the recent scans through to the table', async () => {
    dashData.value = DASH;
    dashStatus.value = 'success';
    scansData.value = {
      items: [
        {
          scanId: 's1',
          libraryId: 'lib-1',
          libraryName: 'Lib',
          status: 'succeeded',
          startedAt: '2026-09-16T00:00:00Z',
          finishedAt: '2026-09-16T00:01:00Z',
          filesScanned: 10,
          coursesAdded: 1,
          errorsCount: 0,
        },
      ],
    };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(wrapper.get('[data-testid="scans-table"]').text()).toContain('1 rows');
  });

  it('passes latestScan.scanId as expandableScanId so its row can expand (tuxedo 250)', async () => {
    dashData.value = DASH; // latestScan.scanId === 'scan-1'
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(wrapper.get('[data-testid="scans-table"]').attributes('data-expandable-scan-id')).toBe(
      'scan-1',
    );
  });

  it('leaves expandableScanId unset when no scan has ever run', async () => {
    dashData.value = { ...DASH, latestScan: null };
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(
      wrapper.get('[data-testid="scans-table"]').attributes('data-expandable-scan-id'),
    ).toBeUndefined();
  });

  // Audit run20 finding 7: "0" over the errors-24h tile read the same
  // whether zero scans ran in the window or scans ran and found nothing —
  // a health indicator that fails toward "everything is fine" is not one.
  describe('errors · 24h tile distinguishes "no scans" from a real zero (audit run20 finding 7)', () => {
    it('shows "no scans" copy, not a bare 0, when the latest scan predates the 24h window', async () => {
      dashData.value = {
        ...DASH,
        latestScan: { ...DASH.latestScan!, startedAt: '2020-01-01T00:00:00Z' },
        errorsLast24h: 0,
      };
      dashStatus.value = 'success';
      scansData.value = { items: [] };
      scansStatus.value = 'success';

      const wrapper = await mountPage();

      const tile = wrapper.get('[data-label="pages.admin.dashboard.statErrors24h"]');
      expect(tile.text()).toContain('admin.dashboard.errorsWindowNone');
      expect(tile.text()).not.toContain('error=true');
    });

    it('shows "no scans" copy when no scan has ever run', async () => {
      dashData.value = { ...DASH, latestScan: null, errorsLast24h: 0 };
      dashStatus.value = 'success';
      scansData.value = { items: [] };
      scansStatus.value = 'success';

      const wrapper = await mountPage();

      const tile = wrapper.get('[data-label="pages.admin.dashboard.statErrors24h"]');
      expect(tile.text()).toContain('admin.dashboard.errorsWindowNone');
    });

    it('shows the real number when a scan ran in the window, error styling included', async () => {
      dashData.value = {
        ...DASH,
        latestScan: { ...DASH.latestScan!, startedAt: new Date().toISOString() },
        errorsLast24h: 9221,
      };
      dashStatus.value = 'success';
      scansData.value = { items: [] };
      scansStatus.value = 'success';

      const wrapper = await mountPage();

      const tile = wrapper.get('[data-label="pages.admin.dashboard.statErrors24h"]');
      expect(tile.text()).toContain('9221');
      expect(tile.text()).toContain('error=true');
    });

    it('shows a trustworthy 0 (no error styling) when a scan ran in the window and found nothing', async () => {
      dashData.value = {
        ...DASH,
        latestScan: { ...DASH.latestScan!, startedAt: new Date().toISOString() },
        errorsLast24h: 0,
      };
      dashStatus.value = 'success';
      scansData.value = { items: [] };
      scansStatus.value = 'success';

      const wrapper = await mountPage();

      const tile = wrapper.get('[data-label="pages.admin.dashboard.statErrors24h"]');
      expect(tile.text()).toContain(': 0 (');
      expect(tile.text()).toContain('error=false');
    });
  });

  it('passes the "completed with errors" label through to the scans table (audit run20 finding 7)', async () => {
    dashData.value = DASH;
    dashStatus.value = 'success';
    scansData.value = { items: [] };
    scansStatus.value = 'success';

    const wrapper = await mountPage();

    expect(
      wrapper.get('[data-testid="scans-table"]').attributes('data-label-succeeded-with-errors'),
    ).toBe('admin.dashboard.scanCompletedWithErrors');
  });
});

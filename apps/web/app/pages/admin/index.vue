<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { AppBanner, AppButton } from '@app/ui';

  import AdminStatCard from '~/components/admin/AdminStatCard.vue';
  import AdminScansTable from '~/components/admin/AdminScansTable.vue';
  import { useAdminDashboard } from '~/composables/useAdminDashboard';
  import { useAdminScans } from '~/composables/useAdminScans';
  import { useScanProgress } from '~/composables/useScanProgress';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();

  const {
    data: dashData,
    status: dashStatus,
    error: dashError,
    refetch: refetchDash,
  } = useAdminDashboard();
  const {
    data: scansData,
    status: scansStatus,
    error: scansError,
    refetch: refetchScans,
  } = useAdminScans();

  // Combined loading and error states
  const isLoading = computed(
    () => dashStatus.value === 'pending' || scansStatus.value === 'pending',
  );

  const hasError = computed(() => dashStatus.value === 'error' || scansStatus.value === 'error');

  const errorMessage = computed(() => {
    return dashError.value?.message ?? scansError.value?.message ?? '';
  });

  async function retryAll(): Promise<void> {
    await Promise.all([refetchDash(), refetchScans()]);
  }

  // ── Stat card values ─────────────────────────────────────────────────────────

  const statLibrariesValue = computed(() => {
    if (!dashData.value) return '—';
    return String(dashData.value.counts.libraries);
  });

  const statLibrariesMeta = computed(() => {
    if (!dashData.value) return '';
    const { courses, lessons } = dashData.value.counts;
    // Two independent plural counts can't share one pipe-message (see the
    // locale file's own comment on `statLibrariesMetaCourses`) — compose the
    // two translated fragments instead of the single key that used to be
    // called here and resolved to nothing in either locale.
    const coursesLabel = t('pages.admin.dashboard.statLibrariesMetaCourses', { n: courses });
    const lessonsLabel = t('pages.admin.dashboard.statLibrariesMetaLessons', { n: lessons });
    return `${coursesLabel} · ${lessonsLabel}`;
  });

  const statUsersValue = computed(() => {
    if (!dashData.value) return '—';
    return String(dashData.value.counts.users);
  });

  const statLastScanValue = computed(() => {
    if (!dashData.value) return '—';
    const scan = dashData.value.latestScan;
    if (!scan) return t('pages.admin.dashboard.statLastScanNever');
    return formatRelative(scan.startedAt);
  });

  const statLastScanMeta = computed(() => {
    if (!dashData.value?.latestScan) return '';
    const scan = dashData.value.latestScan;
    // The dashboard endpoint's `latestScan` only carries `libraryId` (a raw
    // cuid — meaningless in the UI, and the recent-scans table two rows
    // below already names the same library correctly). Join on `scanId`
    // against the recent-scans list, which does carry `libraryName`, rather
    // than rendering the id (#701). Fall back to the truncated id only if
    // the two independent requests ever disagree on what the latest scan is.
    const libraryName =
      scansData.value?.items.find((row) => row.scanId === scan.scanId)?.libraryName ??
      `${scan.libraryId.slice(0, 8)}…`;
    return t('pages.admin.dashboard.statLastScanMeta', {
      libraryName,
      n: scan.filesScanned,
    });
  });

  // Audit run20 finding 7: the tile read "0" whenever no scan fell in the
  // 24h window, indistinguishable from "scans ran and found nothing wrong" —
  // a health indicator that fails toward "everything is fine" is not a
  // health indicator. `latestScan` is the most recent scan across every
  // library (highest `startedAt`); if even that one predates the window, no
  // scan could have landed in it, and `errorsLast24h`'s honest value is "no
  // data", not "zero".
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  const hasScanInLast24h = computed(() => {
    const startedAt = dashData.value?.latestScan?.startedAt;
    if (!startedAt) return false;
    return Date.now() - new Date(startedAt).getTime() < TWENTY_FOUR_HOURS_MS;
  });

  const statErrors24hValue = computed(() => {
    if (!dashData.value) return '—';
    if (!hasScanInLast24h.value) return t('admin.dashboard.errorsWindowNone');
    return String(dashData.value.errorsLast24h);
  });

  const statErrors24hIsError = computed(
    () => hasScanInLast24h.value && (dashData.value?.errorsLast24h ?? 0) > 0,
  );

  // ── Scan table ───────────────────────────────────────────────────────────────

  const scanRows = computed(() => scansData.value?.items ?? []);
  const scansLoading = computed(() => scansStatus.value === 'pending');

  // Only the instance-wide latest scan has real per-file error detail behind
  // it — `AdminScanListItem` (the recent-scans list) only carries
  // `errorsCount`, same as `AdminDashboardLatestScan`; the one place a full
  // `ScanError[]` exists is `GET /libraries/{id}/scans/latest`, which is
  // exactly what `useScanProgress` already polls for the library detail page
  // (#620). Reused here, scoped to whichever library owns the latest scan —
  // that scan is trivially that library's own latest too. Without this the
  // dashboard's chevron was decoration: `AdminScansTable` never got an
  // `expandableScanId` at all, so no row's errorsCount ever became a button
  // (tuxedo 250).
  const latestScanLibraryId = computed(() => dashData.value?.latestScan?.libraryId ?? '');
  const { scan: latestScanDetail } = useScanProgress(latestScanLibraryId);
  const scanErrorsOpen = ref(false);
  const scanErrors = computed(() => latestScanDetail.value?.errors ?? []);
  const hasScanErrors = computed(() => scanErrors.value.length > 0);
  const expandableScanId = computed(() => dashData.value?.latestScan?.scanId ?? null);
  const expandedScanId = computed(() => (scanErrorsOpen.value ? expandableScanId.value : null));

  // ── Helpers ──────────────────────────────────────────────────────────────────

  // Reuses `ui.noteEditor.ago*` — same relative-time copy already translated
  // and used by `PlayerNotesTab.vue`; the hardcoded English `"Xs ago"` this
  // replaced was a plain string-literal violation, invisible until the app
  // ran in `ru`.
  function formatRelative(isoString: string): string {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));
    if (seconds < 5) return t('ui.noteEditor.agoJustNow');
    if (seconds < 60) return t('ui.noteEditor.agoSeconds', { n: seconds });
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('ui.noteEditor.agoMinutes', { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('ui.noteEditor.agoHours', { n: hours });
    return t('ui.noteEditor.agoDays', { n: Math.floor(hours / 24) });
  }
</script>

<template>
  <div class="adm-dashboard">
    <!-- Page header -->
    <div class="adm-dashboard__page-h">
      <div>
        <h1 class="adm-dashboard__title">{{ t('pages.admin.dashboard.title') }}</h1>
        <p class="adm-dashboard__sub">{{ t('pages.admin.dashboard.subtitle') }}</p>
      </div>
    </div>

    <!-- Error state -->
    <AppBanner
      v-if="hasError && !isLoading"
      variant="error"
      :title="t('pages.admin.dashboard.errorTitle')"
      :body="errorMessage"
      class="adm-dashboard__error-banner"
    >
      <template #actions>
        <AppButton
          size="sm"
          variant="secondary"
          :label="t('pages.admin.dashboard.errorRetry')"
          @click="retryAll"
        />
      </template>
    </AppBanner>

    <!-- Stat card grid -->
    <div class="adm-dashboard__grid">
      <!-- Libraries -->
      <AdminStatCard
        icon="library"
        :label="t('pages.admin.dashboard.statLibraries')"
        :value="statLibrariesValue"
        :meta="statLibrariesMeta"
        :loading="isLoading"
      />
      <!-- Users -->
      <AdminStatCard
        icon="users"
        :label="t('pages.admin.dashboard.statUsers')"
        :value="statUsersValue"
        :loading="isLoading"
      />
      <!-- Last scan -->
      <AdminStatCard
        icon="refresh"
        :label="t('pages.admin.dashboard.statLastScan')"
        :value="statLastScanValue"
        :meta="statLastScanMeta"
        :loading="isLoading"
      />
      <!-- Errors 24h -->
      <AdminStatCard
        icon="alert"
        :label="t('pages.admin.dashboard.statErrors24h')"
        :value="statErrors24hValue"
        :error="statErrors24hIsError"
        :loading="isLoading"
      />
    </div>

    <!-- Recent scans table -->
    <div class="adm-dashboard__tbl-h">
      <h2 class="adm-dashboard__tbl-title">{{ t('pages.admin.dashboard.recentScansHeading') }}</h2>
    </div>

    <!-- Scans table (uses shared AdminScansTable) -->
    <AdminScansTable
      v-if="!hasError"
      :items="scanRows"
      :loading="scansLoading"
      show-library
      :col-library="t('pages.admin.dashboard.tableLibrary')"
      :col-status="t('pages.admin.dashboard.tableStatus')"
      :col-started="t('pages.admin.dashboard.tableStarted')"
      :col-duration="t('pages.admin.dashboard.tableDuration')"
      :col-files="t('pages.admin.dashboard.tableFiles')"
      :col-added="t('pages.admin.dashboard.tableAdded')"
      :col-errors="t('pages.admin.dashboard.tableErrors')"
      :label-running="t('pages.admin.dashboard.scanRunning')"
      :label-succeeded="t('pages.libraries.statusSucceeded')"
      :label-succeeded-with-errors="t('admin.dashboard.scanCompletedWithErrors')"
      :label-partial="t('pages.libraries.statusPartial')"
      :label-failed="t('pages.libraries.statusFailed')"
      :label-cancelled="t('pages.libraries.statusCancelled')"
      :expandable-scan-id="expandableScanId"
      :expanded-scan-id="expandedScanId"
      @toggle-errors="scanErrorsOpen = !scanErrorsOpen"
    />

    <!-- Per-file detail for the one expandable row above (#620/tuxedo 250) -->
    <ul
      v-if="scanErrorsOpen && hasScanErrors"
      class="adm-dashboard__scan-errors"
      role="list"
      :aria-label="t('pages.admin.dashboard.tableErrors')"
    >
      <li
        v-for="scanError in scanErrors"
        :key="scanError.path"
        class="adm-dashboard__scan-errors-item"
      >
        <span class="adm-dashboard__scan-errors-path">{{ scanError.path }}</span>
        <span class="adm-dashboard__scan-errors-msg">{{ scanError.message }}</span>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
  $scan-errors-max-h: 220px;

  .adm-dashboard {
    // ── Page header ─────────────────────────────────────────────────────────
    &__page-h {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
      flex-wrap: wrap;
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-semibold);
      color: var(--text-loud);
      letter-spacing: -0.01em;
    }

    &__sub {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__error-banner {
      margin-bottom: var(--space-4);
    }

    // ── Stat grid ───────────────────────────────────────────────────────────
    &__grid {
      display: grid;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      grid-template-columns: 1fr; // xs: 1 col

      @media (width >= 768px) {
        grid-template-columns: repeat(2, 1fr); // md: 2 col
      }

      @media (width >= 1024px) {
        grid-template-columns: repeat(4, 1fr); // lg: 4 col
      }
    }

    // ── Table heading ────────────────────────────────────────────────────────
    &__tbl-h {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }

    &__tbl-title {
      margin: 0;
      font-size: var(--text-md);
      font-weight: var(--fw-semibold);
      color: var(--text-loud);
    }

    // ── Expanded scan-error detail ────────────────────────────────────────────
    &__scan-errors {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin: var(--space-3) 0 0;
      padding: var(--space-3);
      list-style: none;
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      max-height: $scan-errors-max-h;
      overflow-y: auto;
    }

    &__scan-errors-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: var(--space-1) 0;

      & + & {
        border-top: 1px solid var(--border-default);
      }
    }

    &__scan-errors-path {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-loud);
      word-break: break-all;
    }

    &__scan-errors-msg {
      font-size: var(--text-xs);
      color: var(--status-error-fg);
    }
  }
</style>

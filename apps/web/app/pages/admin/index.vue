<script setup lang="ts">
  import { computed, provide } from 'vue';
  import { AppBanner } from '@app/ui';
  import type { ScanStatus } from '@app/api-client-ts';

  import AdminStatCard from '~/components/admin/AdminStatCard.vue';
  import AdminScansTable from '~/components/admin/AdminScansTable.vue';
  import { useAdminDashboard } from '~/composables/useAdminDashboard';
  import { useAdminScans } from '~/composables/useAdminScans';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();

  // Provide page title to the admin layout's breadcrumb
  const pageTitle = computed(() => t('pages.admin.dashboard.title'));
  provide('adminPageTitle', pageTitle);

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
    return t('pages.admin.dashboard.statLibrariesMeta', { n: courses, l: lessons });
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
    const shortId = `${scan.libraryId.slice(0, 8)}…`;
    return t('pages.admin.dashboard.statLastScanMeta', {
      libraryId: shortId,
      n: scan.filesScanned,
    });
  });

  const statErrors24hValue = computed(() => {
    if (!dashData.value) return '—';
    return String(dashData.value.errorsLast24h);
  });

  const statErrors24hIsError = computed(() => (dashData.value?.errorsLast24h ?? 0) > 0);

  // ── Scan table ───────────────────────────────────────────────────────────────

  const scanRows = computed(() => scansData.value?.items ?? []);
  const scansLoading = computed(() => scansStatus.value === 'pending');

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function formatRelative(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${String(diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${String(diffMin)}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${String(diffH)}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${String(diffD)}d ago`;
  }

  // statusLabel is no longer needed in the template — AdminScansTable handles it.
  // Keeping a minimal version for the stat card meta.
  function statusLabel(status: ScanStatus): string {
    const map: Record<ScanStatus, string> = {
      running: t('pages.admin.dashboard.scanRunning'),
      succeeded: t('pages.libraries.statusSucceeded'),
      failed: t('pages.libraries.statusFailed'),
      cancelled: t('pages.libraries.statusCancelled'),
    };
    return map[status];
  }

  void statusLabel; // referenced by statLastScanMeta indirectly; keep for future use
</script>

<template>
  <div class="adm-dashboard">
    <!-- Page header -->
    <div class="adm-dashboard__page-h">
      <div>
        <h2 class="adm-dashboard__title">{{ t('pages.admin.dashboard.title') }}</h2>
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
        <UButton size="sm" variant="outline" color="error" @click="retryAll">
          {{ t('pages.admin.dashboard.errorRetry') }}
        </UButton>
      </template>
    </AppBanner>

    <!-- Stat card grid -->
    <div class="adm-dashboard__grid">
      <!-- Libraries -->
      <AdminStatCard
        icon="i-heroicons-building-library"
        :label="t('pages.admin.dashboard.statLibraries')"
        :value="statLibrariesValue"
        :meta="statLibrariesMeta"
        :loading="isLoading"
      />
      <!-- Users -->
      <AdminStatCard
        icon="i-heroicons-users"
        :label="t('pages.admin.dashboard.statUsers')"
        :value="statUsersValue"
        :loading="isLoading"
      />
      <!-- Last scan -->
      <AdminStatCard
        icon="i-heroicons-arrow-path"
        :label="t('pages.admin.dashboard.statLastScan')"
        :value="statLastScanValue"
        :meta="statLastScanMeta"
        :loading="isLoading"
      />
      <!-- Errors 24h -->
      <AdminStatCard
        icon="i-heroicons-exclamation-triangle"
        :label="t('pages.admin.dashboard.statErrors24h')"
        :value="statErrors24hValue"
        :error="statErrors24hIsError"
        :loading="isLoading"
      />
    </div>

    <!-- Recent scans table -->
    <div class="adm-dashboard__tbl-h">
      <h3 class="adm-dashboard__tbl-title">{{ t('pages.admin.dashboard.recentScansHeading') }}</h3>
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
      :label-failed="t('pages.libraries.statusFailed')"
      :label-cancelled="t('pages.libraries.statusCancelled')"
    />
  </div>
</template>

<style lang="scss" scoped>
  // Named SCSS variables for fixed UI chrome dimensions
  $dur-skel: var(--dur-slow, 1400ms);

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
      font-weight: 600;
      color: var(--text-loud);
      letter-spacing: -0.01em;
    }

    &__sub {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-muted);
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

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr); // md: 2 col
      }

      @media (min-width: 1024px) {
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
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-loud);
    }
  }

  @keyframes adm-skel-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>

<script setup lang="ts">
  import { computed, provide } from 'vue';
  import { AppBanner } from '@app/ui';
  import type { ScanStatus, AdminScanListItem } from '@app/api-client-ts';

  import AdminStatCard from '~/components/admin/AdminStatCard.vue';
  import { useAdminDashboard } from '~/composables/useAdminDashboard';
  import { useAdminScans } from '~/composables/useAdminScans';

  definePageMeta({ layout: 'admin', middleware: 'admin' });

  const { t } = useI18n();

  // Provide page title to the admin layout's breadcrumb
  const pageTitle = computed(() => t('pages.admin.dashboard.title'));
  provide('adminPageTitle', pageTitle);

  const { data: dashData, status: dashStatus, error: dashError, refetch: refetchDash } = useAdminDashboard();
  const { data: scansData, status: scansStatus, error: scansError, refetch: refetchScans } = useAdminScans();

  // Combined loading and error states
  const isLoading = computed(() =>
    dashStatus.value === 'pending' || scansStatus.value === 'pending',
  );

  const hasError = computed(
    () => dashStatus.value === 'error' || scansStatus.value === 'error',
  );

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
    return t('pages.admin.dashboard.statLastScanMeta', { libraryId: shortId, n: scan.filesScanned });
  });

  const statErrors24hValue = computed(() => {
    if (!dashData.value) return '—';
    return String(dashData.value.errorsLast24h);
  });

  const statErrors24hIsError = computed(
    () => (dashData.value?.errorsLast24h ?? 0) > 0,
  );

  // ── Scan table ───────────────────────────────────────────────────────────────

  const scanRows = computed<AdminScanListItem[]>(() => scansData.value?.items ?? []);

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

  function formatDuration(startedAt: string, finishedAt: string | null): string {
    if (!finishedAt) return '—';
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${String(h)}h`);
    if (m > 0) parts.push(`${m.toString().padStart(h > 0 ? 2 : 1, '0')}m`);
    if (s > 0 || parts.length === 0) parts.push(`${String(s)}s`);
    return parts.join(' ');
  }

  function statusLabel(status: ScanStatus): string {
    const map: Record<ScanStatus, string> = {
      running: t('pages.admin.dashboard.scanRunning'),
      succeeded: t('pages.libraries.statusSucceeded'),
      failed: t('pages.libraries.statusFailed'),
      cancelled: t('pages.libraries.statusCancelled'),
    };
    return map[status];
  }
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

    <!-- Skeleton for table -->
    <div v-if="isLoading" class="adm-dashboard__card">
      <div
        v-for="i in 3"
        :key="i"
        class="adm-dashboard__skel-row"
      >
        <div class="adm-dashboard__skel adm-dashboard__skel--circle" />
        <div class="adm-dashboard__skel adm-dashboard__skel--flex" />
        <div class="adm-dashboard__skel adm-dashboard__skel--pill" />
      </div>
    </div>

    <!-- Actual table -->
    <div v-else-if="!hasError" class="adm-dashboard__tbl-wrap">
      <table class="adm-dashboard__tbl" role="table">
        <thead>
          <tr>
            <th>{{ t('pages.admin.dashboard.tableLibrary') }}</th>
            <th>{{ t('pages.admin.dashboard.tableStatus') }}</th>
            <th class="adm-dashboard__col--md-up">{{ t('pages.admin.dashboard.tableStarted') }}</th>
            <th>{{ t('pages.admin.dashboard.tableDuration') }}</th>
            <th class="adm-dashboard__col--lg">{{ t('pages.admin.dashboard.tableFiles') }}</th>
            <th class="adm-dashboard__col--lg">{{ t('pages.admin.dashboard.tableAdded') }}</th>
            <th class="adm-dashboard__col--lg adm-dashboard__col--num">{{ t('pages.admin.dashboard.tableErrors') }}</th>
            <th class="adm-dashboard__col--md-combined" />
            <th aria-label="" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in scanRows"
            :key="row.scanId"
            tabindex="0"
            class="adm-dashboard__tbl-row"
          >
            <!-- Library -->
            <td>
              <div class="adm-dashboard__lib-name">{{ row.libraryName }}</div>
              <div class="adm-dashboard__lib-sub adm-dashboard__col--xs-only">
                {{ formatRelative(row.startedAt) }}
              </div>
            </td>
            <!-- Status pill -->
            <td>
              <span
                class="adm-dashboard__status-pill"
                :data-status="row.status"
              >
                <span class="adm-dashboard__status-dot" aria-hidden="true" />
                {{ statusLabel(row.status) }}
              </span>
            </td>
            <!-- Started (md+) -->
            <td class="adm-dashboard__col--md-up adm-dashboard__mute">
              {{ formatRelative(row.startedAt) }}
            </td>
            <!-- Duration -->
            <td class="adm-dashboard__num-cell">
              {{ formatDuration(row.startedAt, row.finishedAt) }}
            </td>
            <!-- Files (lg) -->
            <td class="adm-dashboard__col--lg adm-dashboard__num-cell">
              {{ row.filesScanned.toLocaleString() }}
            </td>
            <!-- Added (lg) -->
            <td class="adm-dashboard__col--lg adm-dashboard__num-cell adm-dashboard__added">
              +{{ row.coursesAdded }}
            </td>
            <!-- Errors (lg) -->
            <td
              class="adm-dashboard__col--lg adm-dashboard__num-cell"
              :class="{ 'adm-dashboard__errors--nonzero': row.errorsCount > 0 }"
            >
              {{ row.errorsCount }}
            </td>
            <!-- Files+Added combined (md) -->
            <td class="adm-dashboard__col--md-combined adm-dashboard__num-cell">
              {{ row.filesScanned.toLocaleString() }}
              <span class="adm-dashboard__added">+{{ row.coursesAdded }}</span>
            </td>
            <!-- Chevron -->
            <td class="adm-dashboard__chevron-cell">
              <span class="i-heroicons-chevron-right adm-dashboard__chevron" aria-hidden="true" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  // Named SCSS variables for fixed UI chrome dimensions
  $skel-circle: 24px;
  $skel-pill-w: 80px;
  $skel-pill-h: 18px;
  $dot-size: 6px;
  $chevron-size: 14px;
  $dur-skel: var(--dur-slow, 1400ms);
  $dur-dot: var(--dur-slower, 1600ms);

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

    // ── Table header ────────────────────────────────────────────────────────
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

    // ── Skeleton card ────────────────────────────────────────────────────────
    &__card {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-4);
    }

    &__skel-row {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-2) 0;
      align-items: center;

      & + & {
        border-top: 1px solid var(--border-default);
      }
    }

    &__skel {
      background: var(--surface-skeleton-base);
      border-radius: var(--radius-sm);
      animation: adm-skel-pulse $dur-skel ease-in-out infinite;

      &--circle {
        width: $skel-circle;
        height: $skel-circle;
        border-radius: 50%;
        flex-shrink: 0;
      }

      &--flex {
        flex: 1;
        height: var(--text-xs);
      }

      &--pill {
        width: $skel-pill-w;
        height: $skel-pill-h;
        border-radius: var(--radius-pill);
        flex-shrink: 0;
      }
    }

    // ── Table ────────────────────────────────────────────────────────────────
    &__tbl-wrap {
      overflow-x: auto;
    }

    &__tbl {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;

      thead th {
        text-align: left;
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: var(--space-3);
        background: var(--surface-raised);
        border-bottom: 1px solid var(--border-default);
        white-space: nowrap;
      }

      tbody td {
        padding: var(--space-3);
        border-bottom: 1px solid var(--border-default);
        font-size: var(--text-sm);
        color: var(--text-fg);
        vertical-align: middle;
      }

      tbody tr:last-child td {
        border-bottom: 0;
      }
    }

    &__tbl-row {
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
      }

      &:focus-within {
        outline: 2px solid var(--brand-accent);
        outline-offset: -2px;
      }
    }

    &__lib-name {
      font-weight: 500;
      color: var(--text-loud);
    }

    &__lib-sub {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
    }

    &__mute {
      color: var(--text-muted);
    }

    &__num-cell {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--text-loud);
    }

    &__added {
      color: var(--status-success-fg);
    }

    &__errors--nonzero {
      color: var(--status-error-fg);
    }

    &__chevron-cell {
      text-align: right;
    }

    &__chevron {
      width: $chevron-size;
      height: $chevron-size;
      color: var(--text-muted);
    }

    // ── Status pill ──────────────────────────────────────────────────────────
    &__status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-pill);
      font-size: var(--text-xs);
      font-weight: 500;

      &[data-status='running'] {
        background: var(--status-info-soft);
        color: var(--status-info-fg);

        .adm-dashboard__status-dot {
          background: var(--status-info-fg);
          animation: adm-dot-pulse $dur-dot ease-in-out infinite;
        }
      }

      &[data-status='succeeded'] {
        background: var(--status-success-soft);
        color: var(--status-success-fg);

        .adm-dashboard__status-dot {
          background: var(--status-success-fg);
        }
      }

      &[data-status='failed'] {
        background: var(--status-error-soft);
        color: var(--status-error-fg);

        .adm-dashboard__status-dot {
          background: var(--status-error-fg);
        }
      }

      &[data-status='cancelled'] {
        background: var(--surface-raised);
        color: var(--text-muted);

        .adm-dashboard__status-dot {
          background: var(--text-muted);
        }
      }
    }

    &__status-dot {
      width: $dot-size;
      height: $dot-size;
      border-radius: 50%;
      flex-shrink: 0;
    }

    // ── Responsive column visibility ─────────────────────────────────────────
    // lg-only columns
    &__col--lg {
      @media (max-width: 1023px) {
        display: none;
      }
    }

    // md+ columns (hidden on xs)
    &__col--md-up {
      @media (max-width: 767px) {
        display: none;
      }
    }

    // Combined files+added cell for md only (hidden on xs and lg)
    &__col--md-combined {
      @media (max-width: 767px) {
        display: none;
      }

      @media (min-width: 1024px) {
        display: none;
      }
    }

    // xs-only subtitles (hidden on md+)
    &__col--xs-only {
      @media (min-width: 768px) {
        display: none;
      }
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

  @keyframes adm-dot-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>

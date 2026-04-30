<script setup lang="ts">
  import { computed, provide, ref } from 'vue';
  import { AppBanner, AppScanProgress } from '@app/ui';
  import type { LibraryDto } from '@app/api-client-ts';
  import { runLibraryScan, client } from '@app/api-client-ts';

  import AdminCopyablePath from '~/components/admin/AdminCopyablePath.vue';
  import AdminScansTable from '~/components/admin/AdminScansTable.vue';
  import AdminEditLibrarySheet from '~/components/admin/AdminEditLibrarySheet.vue';
  import AdminRemoveLibraryDialog from '~/components/admin/AdminRemoveLibraryDialog.vue';
  import { useAdminLibraries } from '~/composables/useAdminLibraries';
  import { useAdminLibraryScans } from '~/composables/useAdminLibraryScans';
  import { useScanProgress } from '~/composables/useScanProgress';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();
  const route = useRoute();
  const toast = useToast();

  const libraryId = computed(() => String(route.params.id));

  // Load libraries list to get the AdminLibraryListItem for this id
  const {
    data: librariesData,
    status: librariesStatus,
    refetch: refetchLibraries,
  } = useAdminLibraries();

  const libraryBase = computed(
    () => librariesData.value?.items.find((l) => l.id === libraryId.value) ?? null,
  );

  // Local name override applied after a successful rename (avoids full refetch)
  const localName = ref<string | null>(null);

  const library = computed(() => {
    const base = libraryBase.value;
    if (!base) return null;
    if (localName.value !== null) return { ...base, name: localName.value };
    return base;
  });

  function onLibrarySaved(updated: LibraryDto): void {
    localName.value = updated.name;
  }

  const isLoadingLibrary = computed(() => librariesStatus.value === 'pending');
  const hasLibraryError = computed(
    () =>
      librariesStatus.value === 'error' ||
      (librariesStatus.value === 'success' && library.value === null),
  );

  // Provide page title to layout breadcrumb
  const pageTitle = computed(() => library.value?.name ?? t('pages.admin.libraries.title'));
  provide('adminPageTitle', pageTitle);

  // Scan history for this library
  const {
    data: scansData,
    status: scansStatus,
    refetch: refetchScans,
  } = useAdminLibraryScans(libraryId);

  const scanItems = computed(() => scansData.value?.items ?? []);
  const scansLoading = computed(() => scansStatus.value === 'pending');

  // Live scan progress polling
  const {
    scan: liveScan,
    isRunning: scanIsRunning,
    elapsedTime,
    percent,
    start: startPolling,
  } = useScanProgress(libraryId);

  const latestScanStatus = computed(() => library.value?.lastScan?.status ?? null);
  const showScanProgress = computed(
    () => scanIsRunning.value || latestScanStatus.value === 'running',
  );
  const showScanFailed = computed(
    () => latestScanStatus.value === 'failed' && !scanIsRunning.value,
  );

  // Derived relative time helper
  function formatRelative(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return `${String(diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${String(diffMin)}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${String(diffH)}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${String(diffD)}d ago`;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const isScanning = ref(false);

  async function triggerScan(): Promise<void> {
    if (!library.value) return;
    isScanning.value = true;
    try {
      await runLibraryScan({ client, throwOnError: false, path: { id: libraryId.value } });
      await startPolling();
      await Promise.all([refetchLibraries(), refetchScans()]);
    } catch {
      toast.add({ title: t('pages.admin.libraryDetail.scanNowCta'), color: 'error' });
    } finally {
      isScanning.value = false;
    }
  }

  // Edit + Remove dialogs (sheet visibility refs)
  const editOpen = ref(false);
  const removeOpen = ref(false);

  function onEditClick(): void {
    editOpen.value = true;
  }

  function onRemoveClick(): void {
    removeOpen.value = true;
  }

  async function onRetryFailedScan(): Promise<void> {
    await triggerScan();
  }

  // After scan terminates, refresh both list and scan history
  watch(
    () => liveScan.value?.status,
    async (newStatus) => {
      if (newStatus === 'succeeded' || newStatus === 'failed') {
        await Promise.all([refetchLibraries(), refetchScans()]);
      }
    },
  );
</script>

<template>
  <div class="adm-lib-detail">
    <!-- Loading skeleton for the page header -->
    <div v-if="isLoadingLibrary" class="adm-lib-detail__page-h">
      <div class="adm-lib-detail__skel-col">
        <div class="adm-lib-detail__skel adm-lib-detail__skel--crumb" />
        <div class="adm-lib-detail__skel adm-lib-detail__skel--title" />
        <div class="adm-lib-detail__skel adm-lib-detail__skel--path" />
      </div>
    </div>

    <!-- Error: library not found or failed to load -->
    <AppBanner
      v-else-if="hasLibraryError"
      variant="error"
      :title="t('pages.admin.libraryDetail.errorTitle')"
      class="adm-lib-detail__error-banner"
    >
      <template #actions>
        <UButton size="sm" variant="outline" color="error" @click="refetchLibraries()">
          {{ t('pages.admin.libraryDetail.errorRetry') }}
        </UButton>
      </template>
    </AppBanner>

    <template v-else-if="library">
      <!-- Page header -->
      <div class="adm-lib-detail__page-h">
        <div>
          <!-- Breadcrumb -->
          <div class="adm-lib-detail__crumb">
            <span
              class="i-heroicons-building-library adm-lib-detail__crumb-icon"
              aria-hidden="true"
            />
            <NuxtLink to="/admin/libraries" class="adm-lib-detail__crumb-link">
              {{ t('pages.admin.libraryDetail.crumbLibraries') }}
            </NuxtLink>
            <span class="adm-lib-detail__crumb-sep" aria-hidden="true">·</span>
            <span class="adm-lib-detail__crumb-active">{{ library.name }}</span>
          </div>

          <h2 class="adm-lib-detail__title">{{ library.name }}</h2>

          <AdminCopyablePath
            class="adm-lib-detail__path"
            :path="library.rootPath"
            :ariaLabel="t('pages.admin.libraries.colPath') + ': ' + library.rootPath"
          />
        </div>

        <!-- Page actions -->
        <div class="adm-lib-detail__actions">
          <UButton
            variant="ghost"
            icon="i-heroicons-pencil-square"
            size="sm"
            :label="t('pages.admin.libraryDetail.editCta')"
            @click="onEditClick"
          />
          <UButton
            v-if="showScanProgress"
            variant="outline"
            icon="i-heroicons-arrow-path"
            size="sm"
            :label="t('pages.admin.libraryDetail.scanningCta')"
            loading
            disabled
          />
          <UButton
            v-else
            icon="i-heroicons-arrow-path"
            size="sm"
            :label="t('pages.admin.libraryDetail.scanNowCta')"
            :loading="isScanning"
            @click="triggerScan"
          />
        </div>
      </div>

      <!-- Content grid: main + right rail (lg) -->
      <div class="adm-lib-detail__grid">
        <!-- Main column -->
        <div class="adm-lib-detail__main">
          <!-- Live scan progress -->
          <div v-if="showScanProgress" class="adm-lib-detail__scan-progress">
            <AppScanProgress
              status="running"
              :course-name="library.name"
              :percent="percent"
              :elapsed-time="elapsedTime"
              :scanned="liveScan?.filesScanned ?? 0"
              :added="0"
              :updated="0"
              :errors="0"
              :scanning-label="t('pages.admin.libraryDetail.scanProgressScanning')"
              :success-label="t('pages.admin.libraryDetail.scanProgressComplete')"
              :failed-label="t('pages.admin.libraryDetail.scanProgressFailed')"
              :cancel-label="t('pages.admin.libraryDetail.scanProgressCancel')"
              :errors-label="t('pages.admin.libraryDetail.scanProgressErrors', { n: 0 })"
              :stat-scanned-label="t('pages.admin.libraryDetail.scanProgressScanned')"
              :stat-added-label="t('pages.admin.libraryDetail.scanProgressAdded')"
              :stat-updated-label="t('pages.admin.libraryDetail.scanProgressUpdated')"
              :stat-errors-label="t('pages.admin.libraryDetail.scanProgressErrorsStat')"
            />
          </div>

          <!-- Last-scan-failed banner -->
          <AppBanner
            v-else-if="showScanFailed"
            variant="error"
            :title="t('pages.admin.libraryDetail.scanFailedBannerTitle')"
            :body="t('pages.admin.libraryDetail.scanFailedBannerBody')"
            class="adm-lib-detail__failed-banner"
          >
            <template #actions>
              <UButton size="sm" variant="outline" color="error" @click="onRetryFailedScan">
                {{ t('pages.admin.libraryDetail.scanFailedRetry') }}
              </UButton>
            </template>
          </AppBanner>

          <!-- Scan history table -->
          <div class="adm-lib-detail__tbl-h">
            <h3 class="adm-lib-detail__tbl-title">
              {{ t('pages.admin.libraryDetail.scanHistoryHeading') }}
            </h3>
          </div>

          <AdminScansTable
            :items="scanItems"
            :loading="scansLoading"
            :col-status="t('pages.admin.libraryDetail.tableStatus')"
            :col-started="t('pages.admin.libraryDetail.tableStarted')"
            :col-duration="t('pages.admin.libraryDetail.tableDuration')"
            :col-files="t('pages.admin.libraryDetail.tableFiles')"
            :col-added="t('pages.admin.libraryDetail.tableAdded')"
            :col-errors="t('pages.admin.libraryDetail.tableErrors')"
            :label-running="t('pages.libraries.statusRunning')"
            :label-succeeded="t('pages.libraries.statusSucceeded')"
            :label-failed="t('pages.libraries.statusFailed')"
            :label-cancelled="t('pages.libraries.statusCancelled')"
            :show-library="false"
          />
        </div>

        <!-- Right rail (lg only) -->
        <aside class="adm-lib-detail__rail">
          <!-- Details card -->
          <div class="adm-lib-detail__card">
            <div class="adm-lib-detail__card-heading">
              {{ t('pages.admin.libraryDetail.detailsHeading') }}
            </div>
            <dl class="adm-lib-detail__detail-list">
              <div class="adm-lib-detail__detail-row">
                <dt class="adm-lib-detail__detail-label">
                  {{ t('pages.admin.libraryDetail.detailsTotalSize') }}
                </dt>
                <dd class="adm-lib-detail__detail-val adm-lib-detail__detail-val--mono">—</dd>
              </div>
              <div class="adm-lib-detail__detail-row">
                <dt class="adm-lib-detail__detail-label">
                  {{ t('pages.admin.libraryDetail.detailsCourses') }}
                </dt>
                <dd class="adm-lib-detail__detail-val adm-lib-detail__detail-val--mono">
                  {{ library.coursesCount }}
                </dd>
              </div>
              <div class="adm-lib-detail__detail-row">
                <dt class="adm-lib-detail__detail-label">
                  {{ t('pages.admin.libraryDetail.detailsLessons') }}
                </dt>
                <dd class="adm-lib-detail__detail-val adm-lib-detail__detail-val--mono">
                  {{ library.lessonsCount }}
                </dd>
              </div>
              <div class="adm-lib-detail__detail-row">
                <dt class="adm-lib-detail__detail-label">
                  {{ t('pages.admin.libraryDetail.detailsLastScan') }}
                </dt>
                <dd class="adm-lib-detail__detail-val">
                  {{ library.lastScan ? formatRelative(library.lastScan.startedAt) : '—' }}
                </dd>
              </div>
              <div class="adm-lib-detail__detail-row">
                <dt class="adm-lib-detail__detail-label">
                  {{ t('pages.admin.libraryDetail.detailsAutoScan') }}
                </dt>
                <dd class="adm-lib-detail__detail-val">
                  {{ t('pages.admin.libraryDetail.detailsAutoScanManual') }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Danger zone card -->
          <div class="adm-lib-detail__card adm-lib-detail__card--danger">
            <div class="adm-lib-detail__card-heading">
              {{ t('pages.admin.libraryDetail.dangerHeading') }}
            </div>
            <UButton
              variant="outline"
              color="error"
              icon="i-heroicons-trash"
              size="sm"
              :label="t('pages.admin.libraryDetail.dangerRemove')"
              class="adm-lib-detail__danger-btn"
              @click="onRemoveClick"
            />
            <p class="adm-lib-detail__danger-body">
              {{ t('pages.admin.libraryDetail.dangerRemoveBody') }}
            </p>
          </div>
        </aside>
      </div>
    </template>

    <!-- Edit + Remove dialogs (mounted only when a library has loaded) -->
    <template v-if="library">
      <AdminEditLibrarySheet
        v-model:open="editOpen"
        :library="library"
        :title="t('pages.admin.libraryDetail.editTitle')"
        :label-name="t('pages.admin.libraryDetail.editLabelName')"
        :placeholder="library.name"
        :error-empty="t('pages.admin.libraryDetail.editErrorEmpty')"
        :save-label="t('pages.admin.libraryDetail.editSave')"
        :cancel-label="t('pages.admin.libraryDetail.editCancel')"
        @saved="onLibrarySaved"
      />
      <AdminRemoveLibraryDialog
        v-model:open="removeOpen"
        :library="library"
        :dialog-title="t('pages.admin.libraryDetail.removeDialogTitle', { name: library.name })"
        :dialog-body="t('pages.admin.libraryDetail.removeDialogBody')"
        :confirm-prompt="t('pages.admin.libraryDetail.removeConfirmPrompt')"
        :confirm-cta="t('pages.admin.libraryDetail.removeConfirmCta')"
        :cancel-cta="t('pages.admin.libraryDetail.removeCancelCta')"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
  $rail-width: 280px;
  $crumb-icon-size: 11px;
  $skel-crumb-h: 12px;
  $skel-crumb-w: 160px;
  $skel-title-h: 22px;
  $skel-title-w: 240px;
  $skel-path-h: 12px;
  $skel-path-w: 300px;
  $dur-skel: var(--dur-slow, 1400ms);

  .adm-lib-detail {
    &__page-h {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
      flex-wrap: wrap;
    }

    &__skel-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__skel {
      background: var(--surface-skeleton-base);
      border-radius: var(--radius-sm);
      animation: adm-detail-skel-pulse $dur-skel ease-in-out infinite;

      &--crumb {
        height: $skel-crumb-h;
        width: $skel-crumb-w;
      }

      &--title {
        height: $skel-title-h;
        width: $skel-title-w;
      }

      &--path {
        height: $skel-path-h;
        width: $skel-path-w;
      }
    }

    &__error-banner {
      margin-bottom: var(--space-4);
    }

    // ── Breadcrumb ────────────────────────────────────────────────────────────
    &__crumb {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-bottom: var(--space-1);
    }

    &__crumb-icon {
      width: $crumb-icon-size;
      height: $crumb-icon-size;
    }

    &__crumb-link {
      color: var(--text-muted);
      text-decoration: none;

      &:hover {
        color: var(--text-loud);
        text-decoration: underline;
      }
    }

    &__crumb-sep {
      color: var(--text-subtle);
    }

    &__crumb-active {
      color: var(--text-loud);
      font-weight: 500;
    }

    &__title {
      margin: var(--space-1) 0 0;
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--text-loud);
      letter-spacing: -0.01em;
    }

    &__path {
      margin-top: var(--space-2);
      display: inline-flex;
    }

    &__actions {
      display: flex;
      gap: var(--space-2);
      align-items: center;
      flex-wrap: wrap;
    }

    // ── Content grid ──────────────────────────────────────────────────────────
    &__grid {
      display: grid;
      gap: var(--space-4);
      grid-template-columns: 1fr;

      @media (min-width: 1024px) {
        grid-template-columns: 1fr #{$rail-width};
      }
    }

    &__main {
      min-width: 0;
    }

    // ── Scan progress + failed banner ─────────────────────────────────────────
    &__scan-progress {
      margin-bottom: var(--space-4);
    }

    &__failed-banner {
      margin-bottom: var(--space-4);
    }

    // ── Table heading ─────────────────────────────────────────────────────────
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

    // ── Right rail ────────────────────────────────────────────────────────────
    &__rail {
      display: none;
      flex-direction: column;
      gap: var(--space-3);

      @media (min-width: 1024px) {
        display: flex;
      }
    }

    // ── Detail / Danger cards ─────────────────────────────────────────────────
    &__card {
      padding: var(--space-4);
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);

      &--danger {
        border-color: var(--status-error-soft);
      }
    }

    &__card-heading {
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      margin-bottom: var(--space-3);
    }

    &__detail-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
    }

    &__detail-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: var(--space-2);
    }

    &__detail-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    &__detail-val {
      font-size: var(--text-sm);
      color: var(--text-loud);
      text-align: right;

      &--mono {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
      }
    }

    &__danger-btn {
      width: 100%;
      margin-bottom: var(--space-2);
    }

    &__danger-body {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-muted);
      line-height: 1.5;
    }
  }

  @keyframes adm-detail-skel-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>

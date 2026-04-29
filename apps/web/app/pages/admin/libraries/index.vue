<script setup lang="ts">
  import { computed, provide, ref } from 'vue';
  import { AppBanner, AppEmptyState } from '@app/ui';
  import { runLibraryScan, client } from '@app/api-client-ts';

  import AdminLibraryRow from '~/components/admin/AdminLibraryRow.vue';
  import AdminAddLibrarySheet from '~/components/admin/AdminAddLibrarySheet.vue';
  import { useAdminLibraries } from '~/composables/useAdminLibraries';

  definePageMeta({ layout: 'admin', middleware: 'admin' });

  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();

  // Provide page title to the admin layout's breadcrumb
  const pageTitle = computed(() => t('pages.admin.libraries.title'));
  provide('adminPageTitle', pageTitle);

  const { data, status, error, refetch } = useAdminLibraries();

  const isLoading = computed(() => status.value === 'pending');
  const hasError = computed(() => status.value === 'error');
  const items = computed(() => data.value?.items ?? []);
  const isEmpty = computed(() => !isLoading.value && !hasError.value && items.value.length === 0);

  // Sheet state
  const showSheet = ref(false);

  function openSheet(): void {
    showSheet.value = true;
  }

  function onSheetCancel(): void {
    showSheet.value = false;
  }

  async function onRegistered(): Promise<void> {
    showSheet.value = false;
    await refetch();
  }

  // Navigate to library detail
  function goToLibrary(id: string): void {
    void router.push(`/admin/libraries/${id}`);
  }

  // Trigger scan from row action
  async function scanLibrary(id: string): Promise<void> {
    try {
      await runLibraryScan({ client, throwOnError: false, path: { id } });
      await refetch();
    } catch {
      toast.add({ title: t('pages.admin.libraries.errorTitle'), color: 'error' });
    }
  }

  // Subtitle: library count
  const subtitle = computed(() => {
    if (isLoading.value) return '';
    return t('pages.admin.libraries.subtitle', { n: items.value.length });
  });
</script>

<template>
  <div class="adm-libraries">
    <!-- Page header -->
    <div class="adm-libraries__page-h">
      <div>
        <h2 class="adm-libraries__title">{{ t('pages.admin.libraries.title') }}</h2>
        <p v-if="subtitle" class="adm-libraries__sub">{{ subtitle }}</p>
      </div>
      <div class="adm-libraries__page-actions">
        <UButton
          icon="i-heroicons-plus"
          :label="t('pages.admin.libraries.addCta')"
          @click="openSheet"
        />
      </div>
    </div>

    <!-- Error state -->
    <AppBanner
      v-if="hasError && !isLoading"
      variant="error"
      :title="t('pages.admin.libraries.errorTitle')"
      :body="error?.message ?? ''"
      class="adm-libraries__error-banner"
    >
      <template #actions>
        <UButton size="sm" variant="outline" color="error" @click="refetch()">
          {{ t('pages.admin.libraries.errorRetry') }}
        </UButton>
      </template>
    </AppBanner>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="adm-libraries__list">
      <div v-for="i in 4" :key="i" class="adm-libraries__skel-row">
        <div class="adm-libraries__skel adm-libraries__skel--icon" />
        <div class="adm-libraries__skel-col">
          <div class="adm-libraries__skel adm-libraries__skel--name" />
          <div class="adm-libraries__skel adm-libraries__skel--sub" />
        </div>
        <div class="adm-libraries__skel adm-libraries__skel--pill" />
        <div class="adm-libraries__skel adm-libraries__skel--btn" />
      </div>
    </div>

    <!-- Empty state -->
    <AppEmptyState
      v-else-if="isEmpty"
      icon="folder"
      :title="t('pages.admin.libraries.emptyTitle')"
      :body="t('pages.admin.libraries.emptyBody')"
    >
      <template #actions>
        <UButton
          icon="i-heroicons-plus"
          :label="t('pages.admin.libraries.emptyAction')"
          @click="openSheet"
        />
      </template>
    </AppEmptyState>

    <!-- Library list -->
    <div v-else-if="!hasError" class="adm-libraries__list">
      <AdminLibraryRow
        v-for="lib in items"
        :key="lib.id"
        :library="lib"
        :course-count-label="t('pages.admin.libraries.courseCount', { n: lib.coursesCount })"
        :last-scan-never-label="t('pages.admin.libraries.lastScanNever')"
        :last-scan-label="t('pages.admin.libraries.lastScan')"
        :scan-cta-label="t('pages.admin.libraries.scanCta')"
        :more-cta-label="t('pages.admin.libraries.moreCta')"
        :copy-path-aria-label="t('pages.admin.libraries.colPath') + ': ' + lib.rootPath"
        :label-running="t('pages.libraries.statusRunning')"
        :label-succeeded="t('pages.libraries.statusSucceeded')"
        :label-failed="t('pages.libraries.statusFailed')"
        :label-cancelled="t('pages.libraries.statusCancelled')"
        @click="goToLibrary(lib.id)"
        @scan="scanLibrary(lib.id)"
      />
    </div>

    <!-- Add library sheet -->
    <AdminAddLibrarySheet
      v-if="showSheet"
      :title="t('pages.admin.libraries.addSheetTitle')"
      :name-label="t('pages.admin.libraries.addSheetNameLabel')"
      :name-placeholder="t('pages.admin.libraries.addSheetNamePlaceholder')"
      :path-label="t('pages.admin.libraries.addSheetPathLabel')"
      :path-placeholder="t('pages.admin.libraries.addSheetPathPlaceholder')"
      :path-hint="t('pages.admin.libraries.addSheetPathHint')"
      :submit-label="t('pages.admin.libraries.addSheetSubmit')"
      :cancel-label="t('pages.admin.libraries.addSheetCancel')"
      :error-required="t('pages.admin.libraries.addSheetErrorRequired')"
      :error-register="t('pages.admin.libraries.addSheetErrorRegister')"
      @registered="onRegistered"
      @cancel="onSheetCancel"
    />
  </div>
</template>

<style lang="scss" scoped>
  $skel-icon: 28px;
  $skel-btn-w: 60px;
  $skel-btn-h: 24px;
  $skel-pill-w: 90px;
  $skel-pill-h: 18px;
  $skel-name-h: 14px;
  $skel-sub-h: 11px;
  $dur-skel: var(--dur-slow, 1400ms);

  .adm-libraries {
    &__page-h {
      display: flex;
      align-items: flex-start;
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

    &__page-actions {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    &__error-banner {
      margin-bottom: var(--space-4);
    }

    &__list {
      display: flex;
      flex-direction: column;
    }

    // ── Skeleton rows ─────────────────────────────────────────────────────────
    &__skel-row {
      display: grid;
      grid-template-columns: #{$skel-icon} 1fr #{$skel-pill-w} #{$skel-btn-w};
      gap: var(--space-3);
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-surface);
      margin-bottom: var(--space-2);
    }

    &__skel-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__skel {
      background: var(--surface-skeleton-base);
      border-radius: var(--radius-sm);
      animation: adm-libraries-skel-pulse $dur-skel ease-in-out infinite;

      &--icon {
        width: $skel-icon;
        height: $skel-icon;
        border-radius: var(--radius-sm);
        flex-shrink: 0;
      }

      &--name {
        height: $skel-name-h;
        width: 80%;
      }

      &--sub {
        height: $skel-sub-h;
        width: 60%;
      }

      &--pill {
        width: $skel-pill-w;
        height: $skel-pill-h;
        border-radius: var(--radius-pill);
      }

      &--btn {
        width: $skel-btn-w;
        height: $skel-btn-h;
        border-radius: var(--radius-md);
      }
    }
  }

  @keyframes adm-libraries-skel-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>

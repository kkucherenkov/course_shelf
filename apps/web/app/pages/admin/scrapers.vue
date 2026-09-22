<script setup lang="ts">
  /**
   * Admin → Scrapers (E30-F01-S02).
   *
   * See which scrapers loaded, which were rejected, and why — without
   * reading container logs. A rejected definition file is listed alongside
   * loaded scrapers (`loadError` set, `supportedKinds` empty — its parse
   * threw before either could be read from it).
   */
  import { computed } from 'vue';
  import { AppBadge, AppBanner, AppButton, AppEmptyState, AppRow, AppSkeleton } from '@app/ui';
  import type { ScraperInfoDto, ScraperKind } from '@app/api-client-ts';

  import { useAdminScrapers } from '~/composables/useAdminScrapers';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();

  const { data, status, error, refetch } = useAdminScrapers();

  const isLoading = computed(() => status.value === 'pending');
  const hasError = computed(() => status.value === 'error');
  const items = computed(() => data.value?.scrapers ?? []);
  const isEmpty = computed(() => !isLoading.value && !hasError.value && items.value.length === 0);
  const rejectedCount = computed(() => items.value.filter((s) => s.loadError).length);

  const subtitle = computed(() => {
    if (isLoading.value || !data.value) return '';
    return rejectedCount.value > 0
      ? t('pages.admin.scrapers.subtitleWithRejected', {
          n: items.value.length,
          rejected: rejectedCount.value,
        })
      : t('pages.admin.scrapers.subtitle', { n: items.value.length });
  });

  function kindLabel(kind: ScraperKind): string {
    if (kind === 'url') return t('pages.admin.scrapers.kindUrl');
    if (kind === 'name') return t('pages.admin.scrapers.kindName');
    return t('pages.admin.scrapers.kindFragment');
  }

  function kindsSummary(item: ScraperInfoDto): string {
    return item.supportedKinds.map((kind) => kindLabel(kind)).join(' · ');
  }

  function originLabel(item: ScraperInfoDto): string {
    return item.origin === 'definition-file'
      ? t('pages.admin.scrapers.originDefinitionFile')
      : t('pages.admin.scrapers.originBuiltIn');
  }
</script>

<template>
  <div class="adm-scrapers" data-testid="page-admin-scrapers">
    <!-- Page header -->
    <div class="adm-scrapers__page-h">
      <div>
        <h1 class="adm-scrapers__title">{{ t('pages.admin.scrapers.title') }}</h1>
        <p v-if="subtitle" class="adm-scrapers__sub">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Error state -->
    <AppBanner
      v-if="hasError && !isLoading"
      variant="error"
      :title="t('pages.admin.scrapers.errorTitle')"
      :body="error?.message ?? ''"
      class="adm-scrapers__error-banner"
      data-testid="scrapers-error"
    >
      <template #actions>
        <AppButton
          size="sm"
          variant="secondary"
          :label="t('pages.admin.scrapers.errorRetry')"
          @click="refetch()"
        />
      </template>
    </AppBanner>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="adm-scrapers__list" data-testid="scrapers-loading">
      <div v-for="i in 4" :key="i" class="adm-scrapers__skel-row">
        <div class="adm-scrapers__skel-col">
          <AppSkeleton width="120px" height="14px" />
          <AppSkeleton width="180px" height="11px" />
        </div>
        <AppSkeleton width="90px" height="20px" radius="pill" />
      </div>
    </div>

    <!-- Empty state -->
    <AppEmptyState
      v-else-if="isEmpty"
      icon="cloud-down"
      :title="t('pages.admin.scrapers.emptyTitle')"
    />

    <!-- Scraper list -->
    <div v-else-if="!hasError" class="adm-scrapers__list" data-testid="scrapers-list">
      <AppRow
        v-for="item in items"
        :key="item.id"
        class="adm-scrapers__row"
        :data-testid="`scraper-row-${item.id}`"
      >
        <div class="adm-scrapers__row-body">
          <span class="adm-scrapers__id">{{ item.id }}</span>
          <span v-if="item.loadError" class="adm-scrapers__error" data-testid="scraper-load-error">
            {{ item.loadError }}
          </span>
          <span v-else class="adm-scrapers__kinds">{{ kindsSummary(item) }}</span>
        </div>
        <template #trailing>
          <div class="adm-scrapers__badges">
            <AppBadge
              v-if="item.loadError"
              color="error"
              size="sm"
              :label="t('pages.admin.scrapers.statusRejected')"
            />
            <AppBadge
              :color="item.origin === 'definition-file' ? 'info' : 'neutral'"
              size="sm"
              :label="originLabel(item)"
            />
          </div>
        </template>
      </AppRow>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .adm-scrapers {
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

    &__list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__row {
      justify-content: space-between;
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }

    &__row-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    &__id {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__kinds {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__error {
      font-size: var(--text-sm);
      color: var(--status-error-fg);
      overflow-wrap: anywhere;
    }

    &__badges {
      display: flex;
      gap: var(--space-2);
      flex-shrink: 0;
    }

    // ── Skeleton rows ─────────────────────────────────────────────────────────
    &__skel-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-3);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
    }

    &__skel-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
  }
</style>

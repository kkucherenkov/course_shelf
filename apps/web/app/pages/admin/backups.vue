<script setup lang="ts">
  /**
   * Admin → Backups (E31-F01-S02).
   *
   * The API has existed since E21; this is the screen that makes it usable
   * without curl. One action, three visible outcomes: running, a downloadable
   * archive, or the server's problem detail.
   */
  import { computed, onBeforeUnmount, provide, ref } from 'vue';
  import { AppBanner, AppCard, AppSpinner } from '@app/ui';

  import { useAdminBackup } from '~/composables/useAdminBackup';

  definePageMeta({ middleware: 'admin' });

  const { t, locale } = useI18n();

  const pageTitle = computed(() => t('pages.admin.backups.title'));
  provide('adminPageTitle', pageTitle);

  const { status, backup, errorDetail, create } = useAdminBackup();

  // The signed link lives for ~5 minutes. Tick a clock so a link that has gone
  // dead says so, instead of handing the operator a button that 401s.
  const now = ref(Date.now());
  const clock = setInterval(() => {
    now.value = Date.now();
  }, 1000);
  onBeforeUnmount(() => {
    clearInterval(clock);
  });

  const isExpired = computed(() => {
    const expiresAt = backup.value?.expiresAt;
    return expiresAt !== undefined && Date.parse(expiresAt) <= now.value;
  });

  function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    // Units are symbols, not prose — the same in both shipped locales.
    return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit] ?? 'B'}`;
  }

  function formatTime(iso: string): string {
    return new Intl.DateTimeFormat(locale.value, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  }
</script>

<template>
  <div class="adm-backups" data-testid="page-admin-backups">
    <div class="adm-backups__header">
      <h2 class="adm-backups__title">{{ t('pages.admin.backups.title') }}</h2>
      <p class="adm-backups__sub">{{ t('pages.admin.backups.subtitle') }}</p>
    </div>

    <AppBanner
      variant="info"
      :title="t('pages.admin.backups.scopeTitle')"
      :body="t('pages.admin.backups.scopeBody')"
      class="adm-backups__scope"
    />

    <div class="adm-backups__actions">
      <UButton
        icon="i-heroicons-circle-stack"
        :loading="status === 'pending'"
        :disabled="status === 'pending'"
        :label="t('pages.admin.backups.createCta')"
        data-testid="backup-create"
        @click="create"
      />
    </div>

    <!-- In progress -->
    <div
      v-if="status === 'pending'"
      class="adm-backups__progress"
      role="status"
      aria-live="polite"
      data-testid="backup-pending"
    >
      <AppSpinner size="sm" :label="t('pages.admin.backups.pendingTitle')" />
      <div>
        <p class="adm-backups__progress-title">{{ t('pages.admin.backups.pendingTitle') }}</p>
        <p class="adm-backups__progress-body">{{ t('pages.admin.backups.pendingBody') }}</p>
      </div>
    </div>

    <!-- Failure — the server's own detail, verbatim -->
    <AppBanner
      v-else-if="status === 'error'"
      variant="error"
      :title="t('pages.admin.backups.errorTitle')"
      :body="errorDetail ?? t('pages.admin.backups.errorFallback')"
      class="adm-backups__error"
      data-testid="backup-error"
    >
      <template #actions>
        <UButton
          size="sm"
          variant="outline"
          color="error"
          data-testid="backup-retry"
          @click="create"
        >
          {{ t('pages.admin.backups.retry') }}
        </UButton>
      </template>
    </AppBanner>

    <!-- Success -->
    <AppCard
      v-else-if="status === 'success' && backup"
      size="lg"
      class="adm-backups__result"
      data-testid="backup-result"
    >
      <h3 class="adm-backups__result-title">{{ t('pages.admin.backups.readyTitle') }}</h3>

      <dl class="adm-backups__meta">
        <div class="adm-backups__meta-row">
          <dt>{{ t('pages.admin.backups.metaCreatedAt') }}</dt>
          <dd>{{ formatTime(backup.createdAt) }}</dd>
        </div>
        <div class="adm-backups__meta-row">
          <dt>{{ t('pages.admin.backups.metaSize') }}</dt>
          <dd>{{ formatBytes(backup.sizeBytes) }}</dd>
        </div>
        <div class="adm-backups__meta-row">
          <dt>{{ t('pages.admin.backups.metaExpiresAt') }}</dt>
          <dd>{{ formatTime(backup.expiresAt) }}</dd>
        </div>
      </dl>

      <p v-if="isExpired" class="adm-backups__expired" data-testid="backup-expired">
        {{ t('pages.admin.backups.expired') }}
      </p>
      <a
        v-else
        :href="backup.url"
        class="adm-backups__download"
        download
        data-testid="backup-download"
      >
        {{ t('pages.admin.backups.downloadCta') }}
      </a>
    </AppCard>
  </div>
</template>

<style scoped lang="scss">
  // One column of prose and a single action — a full-width admin page would
  // stretch the metadata rows apart for no reason.
  $content-max-width: 640px;

  .adm-backups {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-width: $content-max-width;

    &__title {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--text-fg);
    }

    &__sub {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__progress {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    &__progress-title {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-fg);
    }

    &__progress-body {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__result-title {
      margin: 0 0 var(--space-3);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-fg);
    }

    &__meta {
      margin: 0 0 var(--space-4);
      font-size: var(--text-sm);
    }

    &__meta-row {
      display: flex;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-1) 0;

      dt {
        color: var(--text-secondary);
      }

      dd {
        margin: 0;
        color: var(--text-fg);
      }
    }

    &__download {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: var(--space-8);
      padding-inline: var(--space-4);
      border-radius: var(--radius-md);
      background-color: var(--brand-accent);
      color: var(--brand-accent-fg);
      font-size: var(--text-sm);
      font-weight: 600;
      text-decoration: none;

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__expired {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }
</style>

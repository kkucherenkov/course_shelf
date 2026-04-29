<script setup lang="ts">
  import { computed, provide, ref, watch } from 'vue';
  import { AppBanner, AppEmptyState } from '@app/ui';
  import AdminUserRow from '~/components/admin/AdminUserRow.vue';
  import { useAdminUsers } from '~/composables/useAdminUsers';

  definePageMeta({ layout: 'admin', middleware: 'admin' });

  const { t } = useI18n();

  const pageTitle = computed(() => t('pages.admin.permissions.pickerTitle'));
  provide('adminPageTitle', pageTitle);

  // ── Search ─────────────────────────────────────────────────────────────────
  const searchInput = ref('');
  const search = ref('');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  watch(searchInput, (val) => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      search.value = val;
    }, 250);
  });

  function clearSearch(): void {
    searchInput.value = '';
    search.value = '';
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data, status, error, refetch } = useAdminUsers(search);

  const isLoading = computed(() => status.value === 'pending');
  const hasError = computed(() => status.value === 'error');
  const items = computed(() => data.value?.items ?? []);
  const isEmpty = computed(() => !isLoading.value && !hasError.value && items.value.length === 0);
</script>

<template>
  <div class="adm-perm-picker">
    <!-- Page header -->
    <div class="adm-perm-picker__page-h">
      <div>
        <h2 class="adm-perm-picker__title">{{ t('pages.admin.permissions.pickerTitle') }}</h2>
        <p class="adm-perm-picker__sub">{{ t('pages.admin.permissions.pickerSubtitle') }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="adm-perm-picker__search-row">
      <div class="adm-perm-picker__search-wrap">
        <span
          class="i-heroicons-magnifying-glass adm-perm-picker__search-icon"
          aria-hidden="true"
        />
        <input
          v-model="searchInput"
          type="search"
          class="adm-perm-picker__search"
          :placeholder="t('pages.admin.permissions.pickerSearchPlaceholder')"
          :aria-label="t('pages.admin.permissions.pickerSearchPlaceholder')"
        />
      </div>
    </div>

    <!-- Error state -->
    <AppBanner
      v-if="hasError && !isLoading"
      variant="error"
      :title="t('pages.admin.permissions.errorTitle')"
      :body="error?.message ?? ''"
      class="adm-perm-picker__error-banner"
    >
      <template #actions>
        <UButton size="sm" variant="outline" color="error" @click="refetch()">
          {{ t('pages.admin.permissions.errorRetry') }}
        </UButton>
      </template>
    </AppBanner>

    <!-- Loading skeleton (5 rows) -->
    <div v-if="isLoading" class="adm-perm-picker__list">
      <div v-for="i in 5" :key="i" class="adm-perm-picker__skel-row">
        <div class="adm-perm-picker__skel adm-perm-picker__skel--avatar" />
        <div class="adm-perm-picker__skel-col">
          <div class="adm-perm-picker__skel adm-perm-picker__skel--name" />
          <div class="adm-perm-picker__skel adm-perm-picker__skel--email" />
        </div>
        <div class="adm-perm-picker__skel adm-perm-picker__skel--btn" />
      </div>
    </div>

    <!-- Empty — no match -->
    <AppEmptyState
      v-else-if="isEmpty && search"
      icon="search"
      :title="t('pages.admin.users.emptyNoMatch')"
    >
      <template #action>
        <UButton variant="outline" size="sm" @click="clearSearch">
          {{ t('pages.admin.users.emptyClearSearch') }}
        </UButton>
      </template>
    </AppEmptyState>

    <!-- Empty — no users at all -->
    <AppEmptyState
      v-else-if="isEmpty && !search"
      icon="users"
      :title="t('pages.admin.users.emptyNoUsers')"
    />

    <!-- User list -->
    <div v-else-if="!hasError" class="adm-perm-picker__list">
      <AdminUserRow
        v-for="user in items"
        :key="user.id"
        :user="user"
        :is-self="false"
        :label-admin="t('pages.admin.users.roleAdmin')"
        :label-user="t('pages.admin.users.roleUser')"
        :label-guest="t('pages.admin.users.roleGuest')"
        :label-disabled="t('pages.admin.users.roleDisabled')"
        :role-change-yourself-tooltip="t('pages.admin.users.roleChangeYourselfTooltip')"
        :edit-aria-label="t('pages.admin.permissions.addGrantCta')"
        :more-aria-label="t('pages.admin.users.moreComingSoon')"
        @edit="navigateTo(`/admin/permissions/${user.id}`)"
        @more="() => {}"
        @role-change="() => {}"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-skel: 36px;
  $skel-name-h: 14px;
  $skel-email-h: 11px;
  $skel-btn-w: 48px;
  $skel-btn-h: 24px;
  $search-h: 36px;
  $search-max-w: 360px;
  $search-icon-size: 16px;
  $dur-skel: var(--dur-slow, 1400ms);
  $skel-row-pad-v: 12px;
  $skel-row-pad-h: 14px;

  .adm-perm-picker {
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

    &__search-row {
      margin-bottom: var(--space-4);
    }

    &__search-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 100%;
      max-width: $search-max-w;
    }

    &__search-icon {
      position: absolute;
      left: var(--space-2);
      color: var(--text-muted);
      width: $search-icon-size;
      height: $search-icon-size;
      flex-shrink: 0;
      pointer-events: none;
    }

    &__search {
      width: 100%;
      height: $search-h;
      padding: var(--space-2) var(--space-3) var(--space-2) var(--space-7);
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      color: var(--text-fg);
      outline: none;
      appearance: none;

      &::placeholder {
        color: var(--text-subtle);
      }

      &:focus {
        border-color: var(--brand-accent);
        box-shadow: 0 0 0 2px var(--brand-accent-soft);
      }
    }

    &__list {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    &__skel-row {
      display: grid;
      gap: var(--space-3);
      align-items: center;
      padding: $skel-row-pad-v $skel-row-pad-h;
      border-bottom: 1px solid var(--border-default);
      grid-template-columns: #{$avatar-skel} 1fr auto;

      &:last-child {
        border-bottom: 0;
      }
    }

    &__skel-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    &__skel {
      background: var(--surface-skeleton-base);
      border-radius: var(--radius-sm);
      animation: adm-perm-picker-skel $dur-skel ease-in-out infinite;

      &--avatar {
        width: $avatar-skel;
        height: $avatar-skel;
        border-radius: 50%;
        flex-shrink: 0;
      }

      &--name {
        height: $skel-name-h;
        width: 70%;
      }

      &--email {
        height: $skel-email-h;
        width: 55%;
      }

      &--btn {
        width: $skel-btn-w;
        height: $skel-btn-h;
        border-radius: var(--radius-md);
      }
    }
  }

  @keyframes adm-perm-picker-skel {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  // Explicit: Nuxt 4.5 no longer surfaces auto-imports to template
  // expressions during `nuxt typecheck`, and `navigateTo` is called from the
  // template below. Same `#imports` idiom as `stores/auth.ts`.
  import { navigateTo } from '#imports';
  import { AppBanner, AppButton, AppEmptyState, AppSearchField, AppSkeleton } from '@app/ui';
  import AdminUserRow from '~/components/admin/AdminUserRow.vue';
  import { useAdminUsers } from '~/composables/useAdminUsers';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();
  const toast = useToast();

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

  function handleMoreClick(): void {
    toast.add({ title: t('pages.admin.users.moreComingSoon') });
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
        <h1 class="adm-perm-picker__title">{{ t('pages.admin.permissions.pickerTitle') }}</h1>
        <p class="adm-perm-picker__sub">{{ t('pages.admin.permissions.pickerSubtitle') }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="adm-perm-picker__search-row">
      <AppSearchField
        v-model="searchInput"
        class="adm-perm-picker__search"
        :label="t('pages.admin.permissions.pickerSearchPlaceholder')"
        :placeholder="t('pages.admin.permissions.pickerSearchPlaceholder')"
      />
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
        <AppButton
          size="sm"
          variant="secondary"
          :label="t('pages.admin.permissions.errorRetry')"
          @click="refetch()"
        />
      </template>
    </AppBanner>

    <!-- Loading skeleton (5 rows) -->
    <div v-if="isLoading" class="adm-perm-picker__list">
      <div v-for="i in 5" :key="i" class="adm-perm-picker__skel-row">
        <AppSkeleton width="36px" height="36px" radius="pill" />
        <div class="adm-perm-picker__skel-col">
          <AppSkeleton width="70%" height="14px" />
          <AppSkeleton width="55%" height="11px" />
        </div>
        <AppSkeleton width="48px" height="24px" />
      </div>
    </div>

    <!-- Empty — no match -->
    <AppEmptyState
      v-else-if="isEmpty && search"
      icon="search"
      :title="t('pages.admin.users.emptyNoMatch')"
    >
      <template #action>
        <AppButton
          variant="secondary"
          size="sm"
          :label="t('pages.admin.users.emptyClearSearch')"
          @click="clearSearch"
        />
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
        :roles-editable="false"
        :role-read-only-tooltip="t('pages.admin.permissions.roleChipReadOnlyTooltip')"
        :edit-aria-label="t('pages.admin.users.editPermissions')"
        :more-aria-label="t('pages.admin.users.moreComingSoon')"
        @edit="navigateTo(`/admin/permissions/${user.id}`)"
        @more="handleMoreClick"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-skel: 36px;
  $search-max-w: 360px;
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
      font-weight: var(--fw-semibold);
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

    &__search {
      max-width: $search-max-w;
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
  }
</style>

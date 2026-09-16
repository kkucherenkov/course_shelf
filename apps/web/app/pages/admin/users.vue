<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { AppBanner, AppButton, AppEmptyState, AppSearchField, AppSkeleton } from '@app/ui';
  import type { AdminUpdateUserRequest, AdminUserRole } from '@app/api-client-ts';

  import AdminUserRow from '~/components/admin/AdminUserRow.vue';
  import { useAdminUsers } from '~/composables/useAdminUsers';
  import { useUpdateAdminUser } from '~/composables/useUpdateAdminUser';
  import { useAuthStore } from '~/stores/auth';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();
  const toast = useToast();
  const authStore = useAuthStore();

  // ── Search ────────────────────────────────────────────────────────────────────
  const searchInput = ref('');
  const search = ref('');

  // Debounce: update `search` 250 ms after the user stops typing.
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

  // ── Data ──────────────────────────────────────────────────────────────────────
  const { data, status, error, refetch } = useAdminUsers(search);
  const { update } = useUpdateAdminUser(data);

  const isLoading = computed(() => status.value === 'pending');
  const hasError = computed(() => status.value === 'error');
  const items = computed(() => data.value?.items ?? []);
  const isEmpty = computed(() => !isLoading.value && !hasError.value && items.value.length === 0);

  const subtitle = computed(() => {
    if (isLoading.value || !data.value) return '';
    return t('pages.admin.users.subtitle', { n: items.value.length });
  });

  // ── Self-protect ──────────────────────────────────────────────────────────────
  function isSelf(userId: string): boolean {
    return authStore.user?.id === userId;
  }

  // ── Role change ───────────────────────────────────────────────────────────────
  async function handleRoleChange(
    userId: string,
    patch: { role?: AdminUserRole; banned?: boolean },
  ): Promise<void> {
    // Ignore phantom events from "coming soon" actions.
    if (!patch.role && patch.banned === undefined) return;

    const err = await update(userId, patch as AdminUpdateUserRequest);

    if (err) {
      toast.add({ title: t('pages.admin.users.toastRoleUpdateFailed'), color: 'error' });
      return;
    }

    if (patch.banned === true) {
      toast.add({ title: t('pages.admin.users.toastBanned') });
    } else if (patch.banned === false && !patch.role) {
      toast.add({ title: t('pages.admin.users.toastUnbanned') });
    } else {
      toast.add({ title: t('pages.admin.users.toastRoleUpdated') });
    }
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  function handleEditClick(userId: string): void {
    void navigateTo(`/admin/permissions/${userId}`);
  }

  function handleMoreClick(): void {
    toast.add({ title: t('pages.admin.users.moreComingSoon') });
  }
</script>

<template>
  <div class="adm-users">
    <!-- Page header -->
    <div class="adm-users__page-h">
      <div>
        <h1 class="adm-users__title">{{ t('pages.admin.users.title') }}</h1>
        <p v-if="subtitle" class="adm-users__sub">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="adm-users__search-row">
      <AppSearchField
        v-model="searchInput"
        class="adm-users__search"
        :label="t('pages.admin.users.searchPlaceholder')"
        :placeholder="t('pages.admin.users.searchPlaceholder')"
      />
    </div>

    <!-- Error state -->
    <AppBanner
      v-if="hasError && !isLoading"
      variant="error"
      :title="t('pages.admin.users.errorTitle')"
      :body="error?.message ?? ''"
      class="adm-users__error-banner"
    >
      <template #actions>
        <AppButton
          size="sm"
          variant="secondary"
          :label="t('pages.admin.users.errorRetry')"
          @click="refetch()"
        />
      </template>
    </AppBanner>

    <!-- Loading skeleton (5 rows) -->
    <div v-if="isLoading" class="adm-users__list">
      <!-- Header row placeholder (md+) -->
      <div class="adm-users__header-row" aria-hidden="true">
        <span />
        <span>{{ t('pages.admin.users.colUser') }}</span>
        <span class="adm-users__col--md">{{ t('pages.admin.users.colRole') }}</span>
        <span class="adm-users__col--md">{{ t('pages.admin.users.colJoined') }}</span>
        <span />
      </div>
      <div v-for="i in 5" :key="i" class="adm-users__skel-row">
        <AppSkeleton width="36px" height="36px" radius="pill" />
        <div class="adm-users__skel-col">
          <AppSkeleton width="70%" height="14px" />
          <AppSkeleton width="55%" height="11px" />
        </div>
        <AppSkeleton class="adm-users__col--md" width="60px" height="20px" radius="pill" />
        <AppSkeleton class="adm-users__col--md" width="80px" height="11px" />
        <AppSkeleton width="48px" height="24px" />
      </div>
    </div>

    <!-- Empty state — no match -->
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

    <!-- Empty state — no users at all -->
    <AppEmptyState
      v-else-if="isEmpty && !search"
      icon="users"
      :title="t('pages.admin.users.emptyNoUsers')"
    />

    <!-- User list -->
    <div v-else-if="!hasError" class="adm-users__list">
      <!-- Header row (md+) -->
      <div class="adm-users__header-row" aria-hidden="true">
        <span />
        <span>{{ t('pages.admin.users.colUser') }}</span>
        <span class="adm-users__col--md">{{ t('pages.admin.users.colRole') }}</span>
        <span class="adm-users__col--md">{{ t('pages.admin.users.colJoined') }}</span>
        <span>{{ t('pages.admin.users.colActions') }}</span>
      </div>

      <AdminUserRow
        v-for="user in items"
        :key="user.id"
        :user="user"
        :is-self="isSelf(user.id)"
        :label-admin="t('pages.admin.users.roleAdmin')"
        :label-user="t('pages.admin.users.roleUser')"
        :label-guest="t('pages.admin.users.roleGuest')"
        :label-disabled="t('pages.admin.users.roleDisabled')"
        :role-change-yourself-tooltip="t('pages.admin.users.roleChangeYourselfTooltip')"
        :edit-aria-label="t('pages.admin.users.editPermissions')"
        :more-aria-label="t('pages.admin.users.moreComingSoon')"
        @role-change="(patch) => handleRoleChange(user.id, patch)"
        @edit="handleEditClick(user.id)"
        @more="handleMoreClick"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-skel: 36px;
  $search-max-w: 360px;
  $header-avatar-col: 32px;
  $header-avatar-col-lg: 36px;
  $header-pad-v: 10px;
  $header-pad-h: 14px;
  $skel-row-pad-v: 12px;
  $skel-row-pad-h: 14px;

  .adm-users {
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

    // ── Search ───────────────────────────────────────────────────────────────
    &__search-row {
      margin-bottom: var(--space-4);
    }

    &__search {
      max-width: $search-max-w;
    }

    // ── User list container ─────────────────────────────────────────────────
    &__list {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    // ── Header row (md+) ────────────────────────────────────────────────────
    &__header-row {
      display: none;

      @media (width >= 768px) {
        display: grid;
        gap: var(--space-3);
        align-items: center;
        padding: $header-pad-v $header-pad-h;
        background: var(--surface-raised);
        border-bottom: 1px solid var(--border-default);
        grid-template-columns: $header-avatar-col 1.4fr 0.9fr 0.7fr auto;
        font-size: var(--text-xs);
        font-weight: var(--fw-semibold);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-secondary);
      }

      @media (width >= 1024px) {
        grid-template-columns: $header-avatar-col-lg 1.5fr 1.2fr 0.9fr auto;
      }
    }

    &__col--md {
      display: none;

      @media (width >= 768px) {
        display: block;
      }
    }

    // ── Skeleton rows ────────────────────────────────────────────────────────
    &__skel-row {
      display: grid;
      gap: var(--space-3);
      align-items: center;
      padding: $skel-row-pad-v $skel-row-pad-h;
      border-bottom: 1px solid var(--border-default);
      grid-template-columns: #{$avatar-skel} 1fr auto;

      @media (width >= 768px) {
        grid-template-columns: $header-avatar-col 1.4fr 0.9fr 0.7fr auto;
      }

      @media (width >= 1024px) {
        grid-template-columns: #{$avatar-skel} 1.5fr 1.2fr 0.9fr auto;
      }

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

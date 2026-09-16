<script setup lang="ts">
  /**
   * Admin identify-task queue (E30-F03-S02).
   *
   * Lists every identify task over `listIdentifyTasks`. The `admin`
   * middleware is the real guard (redirects non-admins before this component
   * ever runs) — same pattern as `pages/courses/[id]/edit.vue`.
   */
  import { computed, ref } from 'vue';
  import { AppBanner, AppButton, AppEmptyState, AppSelect, AppSkeleton } from '@app/ui';
  import type { IdentifyTaskStatus } from '@app/api-client-ts';
  import AdminIdentifyTaskRow from '~/components/admin/AdminIdentifyTaskRow.vue';
  import { useIdentifyTasksList } from '~/composables/useIdentifyTasks';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();
  const router = useRouter();

  // Status filter — defaults to `proposed`, the only status that actually
  // needs an admin's attention. 'all' is the AppSelect sentinel for "no
  // status filter", mapped to `undefined` before it reaches the composable.
  type StatusFilterValue = IdentifyTaskStatus | 'all';
  const statusFilterValue = ref<StatusFilterValue>('proposed');
  const statusFilter = computed<IdentifyTaskStatus | undefined>(() =>
    statusFilterValue.value === 'all' ? undefined : statusFilterValue.value,
  );
  const statusFilterOptions = computed<{ id: StatusFilterValue; label: string }[]>(() => [
    { id: 'proposed', label: t('pages.admin.identifyTasks.statusProposed') },
    { id: 'applied', label: t('pages.admin.identifyTasks.statusApplied') },
    { id: 'discarded', label: t('pages.admin.identifyTasks.statusDiscarded') },
    { id: 'all', label: t('pages.admin.identifyTasks.filterAll') },
  ]);

  const { data, status, error, refetch } = useIdentifyTasksList(statusFilter);

  const isLoading = computed(() => status.value === 'pending');
  const hasError = computed(() => status.value === 'error');
  const items = computed(() => data.value?.tasks ?? []);
  const isEmpty = computed(() => !isLoading.value && !hasError.value && items.value.length === 0);

  // The default `status=proposed` filter is itself a filter — an empty queue
  // under it (or any non-'all' choice) doesn't mean the queue is empty, only
  // that nothing matches the current status. Mirrors `browse.vue`'s
  // 'filtered' empty-kind so the copy names the real cause (#600).
  const isFiltered = computed(() => statusFilterValue.value !== 'all');

  function showAllStatuses(): void {
    statusFilterValue.value = 'all';
  }

  const subtitle = computed(() => {
    if (isLoading.value) return '';
    return t('pages.admin.identifyTasks.subtitle', { n: items.value.length });
  });

  function goToTask(id: string): void {
    void router.push(`/admin/identify-tasks/${id}`);
  }
</script>

<template>
  <div class="adm-identify-tasks">
    <div class="adm-identify-tasks__page-h">
      <div>
        <h1 class="adm-identify-tasks__title">{{ t('pages.admin.identifyTasks.title') }}</h1>
        <p v-if="subtitle" class="adm-identify-tasks__sub">{{ subtitle }}</p>
      </div>
      <label class="adm-identify-tasks__filter">
        <span class="adm-identify-tasks__filter-label">
          {{ t('pages.admin.identifyTasks.filterLabel') }}
        </span>
        <AppSelect
          v-model="statusFilterValue"
          :options="statusFilterOptions"
          size="sm"
          data-testid="identify-tasks-status-filter"
        />
      </label>
    </div>

    <AppBanner
      v-if="hasError && !isLoading"
      variant="error"
      :title="t('pages.admin.identifyTasks.errorTitle')"
      :body="error?.message ?? ''"
      class="adm-identify-tasks__error-banner"
    >
      <template #actions>
        <AppButton size="sm" variant="secondary" @click="refetch()">
          {{ t('pages.admin.identifyTasks.errorRetry') }}
        </AppButton>
      </template>
    </AppBanner>

    <div v-if="isLoading" class="adm-identify-tasks__list">
      <div v-for="i in 4" :key="i" class="adm-identify-tasks__skel-row">
        <AppSkeleton width="90px" height="22px" radius="pill" />
        <div class="adm-identify-tasks__skel-col">
          <AppSkeleton width="40%" height="14px" />
          <AppSkeleton width="60%" height="11px" />
        </div>
      </div>
    </div>

    <AppEmptyState
      v-else-if="isEmpty && isFiltered"
      icon="list"
      :title="t('pages.admin.identifyTasks.emptyFilteredTitle')"
      :body="t('pages.admin.identifyTasks.emptyFilteredBody')"
    >
      <template #action>
        <AppButton
          variant="secondary"
          size="sm"
          data-testid="identify-tasks-empty-show-all"
          @click="showAllStatuses"
        >
          {{ t('pages.admin.identifyTasks.emptyShowAll') }}
        </AppButton>
      </template>
    </AppEmptyState>

    <AppEmptyState
      v-else-if="isEmpty"
      icon="list"
      :title="t('pages.admin.identifyTasks.emptyTitle')"
      :body="t('pages.admin.identifyTasks.emptyBody')"
    />

    <div v-else-if="!hasError" class="adm-identify-tasks__list">
      <AdminIdentifyTaskRow
        v-for="task in items"
        :key="task.id"
        :task="task"
        :label-proposed="t('pages.admin.identifyTasks.statusProposed')"
        :label-applied="t('pages.admin.identifyTasks.statusApplied')"
        :label-discarded="t('pages.admin.identifyTasks.statusDiscarded')"
        @click="goToTask(task.id)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .adm-identify-tasks {
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
      font-weight: var(--fw-semibold);
      color: var(--text-loud);
      letter-spacing: -0.01em;
    }

    &__sub {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__filter {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
    }

    &__filter-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    &__error-banner {
      margin-bottom: var(--space-4);
    }

    &__list {
      display: flex;
      flex-direction: column;
    }

    &__skel-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
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
      flex: 1;
    }
  }
</style>

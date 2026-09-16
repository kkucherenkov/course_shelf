<script setup lang="ts">
  /**
   * Admin identify-task review page (E30-F03-S02).
   *
   * Loads one task + its target course via `useIdentifyTask`, renders the
   * per-field `MergeMode` comparison, and wires apply/discard. `admin`
   * middleware is the real guard — see `pages/courses/[id]/edit.vue`.
   */
  import { computed, provide } from 'vue';
  import { AppBanner, AppButton, AppSkeleton } from '@app/ui';
  import type { MergePolicyDto } from '@app/api-client-ts';
  import AdminIdentifyTaskReview from '~/components/admin/AdminIdentifyTaskReview.vue';
  import { useIdentifyTask } from '~/composables/useIdentifyTasks';

  definePageMeta({ layout: 'default', middleware: 'admin' });

  const { t } = useI18n();
  const route = useRoute();
  const toast = useToast();
  const taskId = route.params.id as string;

  const pageTitle = computed(() => t('pages.admin.identifyTaskDetail.title'));
  provide('adminPageTitle', pageTitle);

  const { data, status, refetch, applying, apply, discarding, discard } = useIdentifyTask(taskId);

  async function onApply(policy: MergePolicyDto): Promise<void> {
    const err = await apply(policy);
    if (err) {
      toast.add({ title: t('pages.admin.identifyTaskDetail.applyError'), color: 'error' });
      return;
    }
    toast.add({ title: t('pages.admin.identifyTaskDetail.applySuccess'), color: 'success' });
  }

  async function onDiscard(): Promise<void> {
    const err = await discard();
    if (err) {
      toast.add({ title: t('pages.admin.identifyTaskDetail.discardError'), color: 'error' });
      return;
    }
    toast.add({ title: t('pages.admin.identifyTaskDetail.discardSuccess') });
  }
</script>

<template>
  <div class="page-identify-task">
    <div class="page-identify-task__header">
      <div>
        <div class="page-identify-task__crumb">
          <NuxtLink to="/admin/identify-tasks" class="page-identify-task__crumb-link">
            {{ t('pages.admin.identifyTaskDetail.crumbQueue') }}
          </NuxtLink>
        </div>
        <h1 class="page-identify-task__title">{{ t('pages.admin.identifyTaskDetail.title') }}</h1>
      </div>
    </div>

    <div v-if="status === 'error'" class="page-identify-task__error">
      <AppBanner variant="error" :body="t('pages.admin.identifyTaskDetail.loadingError')" />
      <AppButton
        size="sm"
        variant="secondary"
        :label="t('pages.admin.identifyTaskDetail.retry')"
        @click="refetch()"
      />
    </div>

    <div v-else-if="status === 'pending' || status === 'idle'" class="page-identify-task__skeleton">
      <AppSkeleton width="100%" height="36px" />
      <AppSkeleton width="100%" height="120px" />
    </div>

    <AdminIdentifyTaskReview
      v-else-if="data"
      :task="data.task"
      :course="data.course"
      :applying="applying"
      :discarding="discarding"
      @apply="onApply"
      @discard="onDiscard"
    />
  </div>
</template>

<style scoped lang="scss">
  $page-max-w: 900px;

  .page-identify-task {
    max-width: $page-max-w;
    margin: 0 auto;
    padding: var(--space-6) var(--space-6) var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }

    &__crumb {
      font-size: var(--text-xs);
      margin-bottom: var(--space-1);
    }

    &__crumb-link {
      color: var(--text-muted);
      text-decoration: none;

      &:hover {
        color: var(--text-loud);
        text-decoration: underline;
      }
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--text-loud);
    }

    &__error {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--space-3);
    }

    &__skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
  }
</style>

<script setup lang="ts">
  /**
   * Admin-only course metadata editor (E30-F03-S01).
   *
   * Nests under `pages/courses/[id].vue` via Nuxt's file-based routing (same
   * mechanism the lesson player page already uses) — that parent delegates to
   * `<NuxtPage />` whenever a child route is active, so this page renders in
   * place of the course detail view rather than the two composing visually.
   *
   * `definePageMeta({ middleware: 'admin' })` below is vestigial — same as
   * every `pages/admin/*.vue` page's, see `middleware/admin.ts`'s doc
   * comment. The real guard is `AdminAccessGate`, wired from
   * `layouts/default.vue` and matching this route via
   * `useAdminAccess.ts`'s `isAdminGatedRoute` (#795) — the "Edit metadata"
   * entry point on the course detail page is just a convenience link, not
   * the boundary.
   */
  import { ref } from 'vue';
  import { onBeforeRouteLeave } from 'vue-router';
  import { AppBanner, AppButton, AppDialog, AppSkeleton } from '@app/ui';
  import type { UpdateCourseRequest } from '@app/api-client-ts';
  import { useCourseEdit } from '~/composables/useCourseEdit';
  import CourseMetadataForm from '~/components/course-edit/CourseMetadataForm.vue';

  definePageMeta({ layout: 'default', middleware: 'admin' });

  const { t } = useI18n();
  const route = useRoute();
  const toast = useToast();
  const courseId = route.params.id as string;

  const { data, status, refetch, saving, save } = useCourseEdit(courseId);

  // Bumped on every successful save to remount CourseMetadataForm with fresh
  // `data` — that resets its internal form/touched state to match the server,
  // which is correct because it now equals exactly what was just sent.
  const formVersion = ref(0);

  async function onSubmit(payload: UpdateCourseRequest): Promise<void> {
    if (Object.keys(payload).length === 0) {
      toast.add({ title: t('pages.courseEdit.noChanges') });
      return;
    }
    const err = await save(payload);
    if (err) {
      toast.add({ title: t('pages.courseEdit.saveError'), color: 'error' });
      return;
    }
    formVersion.value += 1;
    toast.add({ title: t('pages.courseEdit.saveSuccess'), color: 'success' });
  }

  // ── Leave guard (#570) ────────────────────────────────────────────────────
  //
  // The only exit affordance left on this page is the footer's Cancel button
  // (see template) — the header used to carry a second "Back to course" link
  // to the same route, which was pure duplication now that every route away
  // from here goes through `onBeforeRouteLeave` below regardless of which
  // widget triggered it (a link click, `navigateTo`, or the sidebar nav).
  // `InstanceType<typeof CourseMetadataForm>` doesn't carry what `defineExpose`
  // adds (that's a known gap in Vue's template-ref typing, not this file's
  // doing) — spelling out the one exposed member we read is Vue's own
  // documented workaround.
  const formRef = ref<{ hasChanges: boolean } | null>(null);
  const leaveConfirmOpen = ref(false);
  let resolveLeaveConfirm: ((discard: boolean) => void) | null = null;

  function confirmDiscard(): Promise<boolean> {
    leaveConfirmOpen.value = true;
    return new Promise((resolve) => {
      resolveLeaveConfirm = resolve;
    });
  }

  function settleLeaveConfirm(discard: boolean): void {
    leaveConfirmOpen.value = false;
    resolveLeaveConfirm?.(discard);
    resolveLeaveConfirm = null;
  }

  onBeforeRouteLeave(async () => {
    if (!formRef.value?.hasChanges) return true;
    return confirmDiscard();
  });

  function onBeforeUnload(event: BeforeUnloadEvent): void {
    if (!formRef.value?.hasChanges) return;
    // Browsers show their own generic prompt here — the string is ignored by
    // every modern engine, only the presence of `returnValue` matters.
    event.preventDefault();
    // `returnValue` is formally deprecated but still the only thing Firefox
    // honours to actually show the prompt — `preventDefault()` alone is not
    // enough there yet.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    event.returnValue = '';
  }

  onMounted(() => {
    globalThis.window.addEventListener('beforeunload', onBeforeUnload);
  });
  onUnmounted(() => {
    globalThis.window.removeEventListener('beforeunload', onBeforeUnload);
  });

  function onCancel(): void {
    void navigateTo(`/courses/${courseId}`);
  }
</script>

<template>
  <div class="page-course-edit">
    <div class="page-course-edit__header">
      <h1 class="page-course-edit__title">{{ t('pages.courseEdit.title') }}</h1>
    </div>

    <div v-if="status === 'error'" class="page-course-edit__error">
      <AppBanner variant="error" :body="t('pages.courseEdit.loadingError')" />
      <AppButton variant="secondary" :label="t('pages.courseEdit.retry')" @click="refetch()" />
    </div>

    <div v-else-if="status === 'pending' || status === 'idle'" class="page-course-edit__skeleton">
      <AppSkeleton width="100%" height="36px" />
      <AppSkeleton width="100%" height="36px" />
      <AppSkeleton width="60%" height="24px" />
    </div>

    <CourseMetadataForm
      v-else-if="data"
      ref="formRef"
      :key="formVersion"
      :course="data"
      :saving="saving"
      @submit="onSubmit"
      @cancel="onCancel"
    />

    <AppDialog
      :open="leaveConfirmOpen"
      size="sm"
      :title="t('pages.courseEdit.leaveGuard.title')"
      :description="t('pages.courseEdit.leaveGuard.description')"
      @update:open="(open) => !open && settleLeaveConfirm(false)"
    >
      <template #footer>
        <AppButton
          variant="ghost"
          :label="t('pages.courseEdit.leaveGuard.stay')"
          @click="settleLeaveConfirm(false)"
        />
        <AppButton
          variant="destructive"
          :label="t('pages.courseEdit.leaveGuard.discard')"
          @click="settleLeaveConfirm(true)"
        />
      </template>
    </AppDialog>
  </div>
</template>

<style scoped lang="scss">
  $page-max-w: 800px;

  .page-course-edit {
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

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-semibold);
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

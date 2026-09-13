<script setup lang="ts">
  /**
   * Admin-only course metadata editor (E30-F03-S01).
   *
   * Nests under `pages/courses/[id].vue` via Nuxt's file-based routing (same
   * mechanism the lesson player page already uses) — that parent delegates to
   * `<NuxtPage />` whenever a child route is active, so this page renders in
   * place of the course detail view rather than the two composing visually.
   *
   * The `admin` middleware is the real guard (redirects non-admins before
   * this component ever runs) — the "Edit metadata" entry point on the course
   * detail page is just a convenience link, not the boundary.
   */
  import { ref } from 'vue';
  import { AppBanner, AppButton, AppSkeleton } from '@app/ui';
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

  function onCancel(): void {
    void navigateTo(`/courses/${courseId}`);
  }
</script>

<template>
  <div class="page-course-edit">
    <div class="page-course-edit__header">
      <h1 class="page-course-edit__title">{{ t('pages.courseEdit.title') }}</h1>
      <AppButton
        variant="ghost"
        size="sm"
        :label="t('pages.courseEdit.back')"
        :to="`/courses/${courseId}`"
      />
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
      :key="formVersion"
      :course="data"
      :saving="saving"
      @submit="onSubmit"
      @cancel="onCancel"
    />
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

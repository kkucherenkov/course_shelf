<script setup lang="ts">
  import { ref } from 'vue';
  import { AppBanner, AppButton, AppEmptyState, AppField, AppInput } from '@app/ui';
  import type { LibraryDto } from '@app/api-client-ts';

  import { useLibraries } from '~/composables/useLibraries';
  import LibraryRow from '~/components/libraries/LibraryRow.vue';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const { data, status, error, register } = useLibraries();

  // ── Add-form state ─────────────────────────────────────────────────────────
  const showForm = ref(false);
  const newName = ref('');
  const newPath = ref('');
  const submitting = ref(false);
  const formError = ref('');

  function openForm(): void {
    showForm.value = true;
    formError.value = '';
    newName.value = '';
    newPath.value = '';
  }

  function cancelForm(): void {
    showForm.value = false;
    formError.value = '';
  }

  async function onSubmit(): Promise<void> {
    if (!newName.value.trim() || !newPath.value.trim()) {
      formError.value = t('pages.libraries.errorRequired');
      return;
    }
    submitting.value = true;
    formError.value = '';
    try {
      await register({ name: newName.value.trim(), rootPath: newPath.value.trim() });
      showForm.value = false;
      newName.value = '';
      newPath.value = '';
    } catch {
      formError.value = t('pages.libraries.errorRegister');
    } finally {
      submitting.value = false;
    }
  }

  // Refresh the list after a child triggers a scan that completes.
  function onScanFinished(): void {
    // Scans don't change the library list itself — no need to refetch unless
    // we ever surface course counts here.
  }

  function libraryKey(lib: LibraryDto): string {
    return lib.id;
  }
</script>

<template>
  <div class="page-libraries" data-testid="page-libraries">
    <header class="page-libraries__header">
      <div>
        <h1 class="page-libraries__title">{{ t('pages.libraries.title') }}</h1>
        <p class="page-libraries__subtitle">{{ t('pages.libraries.subtitle') }}</p>
      </div>
      <AppButton
        v-if="!showForm"
        variant="primary"
        :label="t('pages.libraries.addButton')"
        icon-leading="plus"
        @click="openForm"
      />
    </header>

    <!-- Add form -->
    <section v-if="showForm" class="page-libraries__form-card">
      <h2 class="page-libraries__form-title">{{ t('pages.libraries.formTitle') }}</h2>

      <AppBanner
        v-if="formError"
        variant="error"
        :body="formError"
        class="page-libraries__form-banner"
      />

      <form class="page-libraries__form" novalidate @submit.prevent="onSubmit">
        <AppField :label="t('pages.libraries.nameLabel')" required>
          <template #default="slotAttrs">
            <AppInput
              v-bind="slotAttrs"
              v-model="newName"
              :placeholder="t('pages.libraries.namePlaceholder')"
              :disabled="submitting"
              required
            />
          </template>
        </AppField>

        <AppField
          :label="t('pages.libraries.pathLabel')"
          :help="t('pages.libraries.pathHelp')"
          required
        >
          <template #default="slotAttrs">
            <AppInput
              v-bind="slotAttrs"
              v-model="newPath"
              :placeholder="t('pages.libraries.pathPlaceholder')"
              :disabled="submitting"
              required
            />
          </template>
        </AppField>

        <div class="page-libraries__form-actions">
          <AppButton
            type="button"
            variant="ghost"
            :label="t('pages.libraries.cancelButton')"
            :disabled="submitting"
            @click="cancelForm"
          />
          <AppButton
            type="submit"
            variant="primary"
            :label="t('pages.libraries.submitButton')"
            :loading="submitting"
          />
        </div>
      </form>
    </section>

    <!-- List -->
    <section v-if="status === 'pending'" class="page-libraries__loading">
      <div class="page-libraries__skeleton" />
      <div class="page-libraries__skeleton" />
    </section>

    <AppBanner
      v-else-if="status === 'error'"
      variant="error"
      :title="t('pages.libraries.loadError')"
      :body="error?.message ?? ''"
    />

    <AppEmptyState
      v-else-if="(data?.items.length ?? 0) === 0"
      icon="folder"
      :title="t('pages.libraries.emptyTitle')"
      :body="t('pages.libraries.emptyBody')"
    />

    <ul v-else class="page-libraries__list">
      <li v-for="lib in data?.items" :key="libraryKey(lib)" class="page-libraries__item">
        <LibraryRow :library="lib" @scan-finished="onScanFinished" />
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
  .page-libraries {
    max-width: 880px;
    margin: 0 auto;
    padding: 0 var(--space-4) var(--space-8);

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--text-fg);
    }

    &__subtitle {
      margin: var(--space-1) 0 0;
      font-size: var(--text-sm);
      color: var(--text-fg-muted);
    }

    &__form-card {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      margin-bottom: var(--space-6);
    }

    &__form-title {
      margin: 0 0 var(--space-4);
      font-size: var(--text-lg);
      font-weight: 500;
    }

    &__form-banner {
      margin-bottom: var(--space-3);
    }

    &__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    &__form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
    }

    &__loading {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    &__skeleton {
      height: 80px;
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      animation: page-libraries-pulse 1.4s ease-in-out infinite;
    }

    &__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    &__item {
      display: block;
    }
  }

  @keyframes page-libraries-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.6;
    }
  }
</style>

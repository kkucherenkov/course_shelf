<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { AppBanner, AppField, AppInput, AppButton } from '@app/ui';
  import { updateLibrary, client } from '@app/api-client-ts';
  import type { LibraryDto } from '@app/api-client-ts';

  interface LibraryLike {
    id: string;
    name: string;
  }

  interface Props {
    open: boolean;
    library: LibraryLike;
    /** Pre-translated strings */
    title: string;
    labelName: string;
    placeholder: string;
    errorEmpty: string;
    saveLabel: string;
    cancelLabel: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    saved: [library: LibraryDto];
  }>();

  const nameValue = ref(props.library.name);
  const submitting = ref(false);
  const inlineError = ref('');

  // Pre-fill whenever the sheet opens or the library prop changes
  watch(
    () => [props.open, props.library.name] as const,
    ([open, name]) => {
      if (open) {
        nameValue.value = name;
        inlineError.value = '';
      }
    },
  );

  function close(): void {
    emit('update:open', false);
  }

  function onCancel(): void {
    inlineError.value = '';
    close();
  }

  async function onSubmit(): Promise<void> {
    const trimmed = nameValue.value.trim();

    if (!trimmed) {
      inlineError.value = props.errorEmpty;
      return;
    }

    // No-op: name unchanged
    if (trimmed === props.library.name) {
      close();
      return;
    }

    submitting.value = true;
    inlineError.value = '';

    try {
      const res = await updateLibrary({
        client,
        throwOnError: false,
        path: { id: props.library.id },
        body: { name: trimmed },
      });

      if (res.error) {
        const status = res.response.status;
        if (status === 403) {
          useToast().add({
            title: useI18n().t('pages.admin.libraryDetail.editToast403'),
            color: 'error',
          });
          close();
          return;
        }
        if (status === 404) {
          useToast().add({
            title: useI18n().t('pages.admin.libraryDetail.editToastGone'),
            color: 'warning',
          });
          close();
          await navigateTo('/admin/libraries');
          return;
        }
        // 400 or other: show inline
        inlineError.value =
          'detail' in res.error
            ? String((res.error as Record<string, unknown>).detail)
            : props.errorEmpty;
        return;
      }

      useToast().add({
        title: useI18n().t('pages.admin.libraryDetail.editToastSaved'),
        color: 'success',
      });
      emit('saved', res.data as LibraryDto);
      close();
    } finally {
      submitting.value = false;
    }
  }
</script>

<template>
  <template v-if="props.open">
    <div class="adm-edit-lib-sheet" role="dialog" :aria-label="props.title" aria-modal="true">
      <div class="adm-edit-lib-sheet__header">
        <h3 class="adm-edit-lib-sheet__title">{{ props.title }}</h3>
        <button
          type="button"
          class="adm-edit-lib-sheet__close"
          :aria-label="props.cancelLabel"
          @click="onCancel"
        >
          <span class="i-heroicons-x-mark" aria-hidden="true" />
        </button>
      </div>

      <div class="adm-edit-lib-sheet__body">
        <AppBanner
          v-if="inlineError"
          variant="error"
          :body="inlineError"
          class="adm-edit-lib-sheet__banner"
        />

        <form novalidate @submit.prevent="onSubmit">
          <div class="adm-edit-lib-sheet__fields">
            <AppField :label="props.labelName" required>
              <template #default="slotAttrs">
                <AppInput
                  v-bind="slotAttrs"
                  v-model="nameValue"
                  :placeholder="props.placeholder"
                  :disabled="submitting"
                  required
                />
              </template>
            </AppField>
          </div>

          <div class="adm-edit-lib-sheet__foot">
            <AppButton
              type="button"
              variant="ghost"
              :label="props.cancelLabel"
              :disabled="submitting"
              @click="onCancel"
            />
            <AppButton
              type="submit"
              variant="primary"
              :label="props.saveLabel"
              :loading="submitting"
            />
          </div>
        </form>
      </div>
    </div>

    <!-- Backdrop -->
    <div class="adm-edit-lib-sheet__backdrop" aria-hidden="true" @click="onCancel" />
  </template>
</template>

<style lang="scss" scoped>
  $sheet-width-md: 380px;
  $header-height: 52px;
  $close-btn-size: 28px;

  .adm-edit-lib-sheet {
    position: fixed;
    inset: 0 0 0 auto;
    width: $sheet-width-md;
    background: var(--surface-surface);
    border-left: 1px solid var(--border-default);
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    z-index: var(--z-modal);

    @media (max-width: 767px) {
      inset: auto 0 0;
      width: 100%;
      border-left: 0;
      border-top: 1px solid var(--border-default);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      max-height: 80dvh;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-default);
      min-height: $header-height;
    }

    &__title {
      margin: 0;
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-loud);
    }

    &__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: $close-btn-size;
      height: $close-btn-size;
      border: none;
      background: none;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;

      &:hover {
        background: var(--surface-raised);
        color: var(--text-loud);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }

    &__body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    &__banner {
      margin-bottom: var(--space-2);
    }

    &__fields {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    &__foot {
      display: flex;
      gap: var(--space-2);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-default);

      > * {
        flex: 1;
      }
    }
  }

  .adm-edit-lib-sheet__backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, transparent, var(--surface-overlay) 50%);
    z-index: calc(var(--z-modal) - 1);
  }
</style>

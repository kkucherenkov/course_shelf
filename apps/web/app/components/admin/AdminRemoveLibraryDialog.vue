<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { removeLibrary, client } from '@app/api-client-ts';

  interface LibraryLike {
    id: string;
    name: string;
  }

  interface Props {
    open: boolean;
    library: LibraryLike;
    /** Pre-translated strings */
    dialogTitle: string;
    dialogBody: string;
    confirmPrompt: string;
    confirmCta: string;
    cancelCta: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    'update:open': [value: boolean];
    removed: [];
  }>();

  const typedName = ref('');
  const submitting = ref(false);

  const confirmEnabled = computed(
    () => typedName.value === props.library.name && !submitting.value,
  );

  // Reset typed name whenever dialog opens
  watch(
    () => props.open,
    (open) => {
      if (open) {
        typedName.value = '';
      }
    },
  );

  function close(): void {
    emit('update:open', false);
  }

  async function onConfirm(): Promise<void> {
    if (!confirmEnabled.value) return;

    submitting.value = true;
    try {
      const res = await removeLibrary({
        client,
        throwOnError: false,
        path: { id: props.library.id },
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
        useToast().add({
          title: useI18n().t('pages.admin.libraryDetail.editToastGone'),
          color: 'error',
        });
        close();
        return;
      }

      useToast().add({
        title: useI18n().t('pages.admin.libraryDetail.removeToastDone'),
        color: 'success',
      });
      emit('removed');
      close();
      await navigateTo('/admin/libraries');
    } finally {
      submitting.value = false;
    }
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') close();
  }
</script>

<template>
  <template v-if="props.open">
    <!-- Backdrop -->
    <div class="adm-remove-lib-dialog__backdrop" aria-hidden="true" @click="close" />

    <!-- Dialog -->
    <div
      class="adm-remove-lib-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="props.dialogTitle"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <div class="adm-remove-lib-dialog__header">
        <h3 class="adm-remove-lib-dialog__title">{{ props.dialogTitle }}</h3>
        <button
          type="button"
          class="adm-remove-lib-dialog__close"
          :aria-label="props.cancelCta"
          @click="close"
        >
          <span class="i-heroicons-x-mark" aria-hidden="true" />
        </button>
      </div>

      <div class="adm-remove-lib-dialog__body">
        <p class="adm-remove-lib-dialog__desc">{{ props.dialogBody }}</p>

        <label class="adm-remove-lib-dialog__confirm-label" for="adm-remove-confirm-input">
          {{ props.confirmPrompt }}
        </label>
        <input
          id="adm-remove-confirm-input"
          v-model="typedName"
          type="text"
          class="adm-remove-lib-dialog__confirm-input"
          :placeholder="props.library.name"
          autocomplete="off"
          :disabled="submitting"
        />
      </div>

      <div class="adm-remove-lib-dialog__foot">
        <button
          type="button"
          class="adm-remove-lib-dialog__btn adm-remove-lib-dialog__btn--ghost"
          :disabled="submitting"
          @click="close"
        >
          {{ props.cancelCta }}
        </button>
        <button
          type="button"
          class="adm-remove-lib-dialog__btn adm-remove-lib-dialog__btn--danger"
          :disabled="!confirmEnabled"
          @click="onConfirm"
        >
          {{ props.confirmCta }}
        </button>
      </div>
    </div>
  </template>
</template>

<style lang="scss" scoped>
  $dialog-width: 440px;
  $close-btn-size: 28px;

  .adm-remove-lib-dialog__backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, transparent, var(--surface-overlay) 50%);
    z-index: var(--z-modal);
  }

  .adm-remove-lib-dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min($dialog-width, calc(100vw - var(--space-6)));
    background: var(--surface-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: calc(var(--z-modal) + 1);
    display: flex;
    flex-direction: column;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-4) var(--space-3);
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
      flex-shrink: 0;

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
      padding: 0 var(--space-4) var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    &__desc {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-muted);
      line-height: 1.6;
    }

    &__confirm-label {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--text-loud);
    }

    &__confirm-input {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-raised);
      color: var(--text-loud);
      font-size: var(--text-sm);
      font-family: inherit;
      outline: none;
      box-sizing: border-box;

      &::placeholder {
        color: var(--text-subtle);
      }

      &:focus {
        border-color: var(--brand-accent);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-accent) 20%, transparent);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    &__foot {
      display: flex;
      gap: var(--space-2);
      justify-content: flex-end;
      padding: var(--space-3) var(--space-4) var(--space-4);
      border-top: 1px solid var(--border-default);
    }

    &__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid transparent;
      transition:
        background 0.15s,
        color 0.15s,
        border-color 0.15s;

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      &--ghost {
        background: none;
        color: var(--text-muted);
        border-color: var(--border-default);

        &:not(:disabled):hover {
          background: var(--surface-raised);
          color: var(--text-loud);
        }
      }

      &--danger {
        background: var(--status-error-soft);
        color: var(--status-error);
        border-color: transparent;

        &:not(:disabled):hover {
          background: var(--status-error);
          color: var(--color-white, #fff);
        }

        &:focus-visible {
          outline: 2px solid var(--status-error);
          outline-offset: 2px;
        }
      }
    }
  }
</style>

<script setup lang="ts">
  import { ref } from 'vue';
  import { AppBanner, AppField, AppInput, AppButton } from '@app/ui';
  import { registerLibrary, client } from '@app/api-client-ts';

  interface Props {
    /** Sheet title — provided as translated string by the consumer. */
    title: string;
    nameLabel: string;
    namePlaceholder: string;
    pathLabel: string;
    pathPlaceholder: string;
    pathHint: string;
    submitLabel: string;
    cancelLabel: string;
    errorRequired: string;
    errorRegister: string;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    /** Emitted when the library was successfully registered. */
    registered: [];
    /** Emitted when the user cancels. */
    cancel: [];
  }>();

  const newName = ref('');
  const newPath = ref('');
  const submitting = ref(false);
  const formError = ref('');

  function reset(): void {
    newName.value = '';
    newPath.value = '';
    submitting.value = false;
    formError.value = '';
  }

  function onCancel(): void {
    reset();
    emit('cancel');
  }

  async function onSubmit(): Promise<void> {
    if (!newName.value.trim() || !newPath.value.trim()) {
      formError.value = props.errorRequired;
      return;
    }
    submitting.value = true;
    formError.value = '';
    try {
      const res = await registerLibrary({
        client,
        throwOnError: false,
        body: { name: newName.value.trim(), rootPath: newPath.value.trim() },
      });
      if (res.error && res.response.status !== 409) {
        formError.value = props.errorRegister;
        return;
      }
      reset();
      emit('registered');
    } catch {
      formError.value = props.errorRegister;
    } finally {
      submitting.value = false;
    }
  }
</script>

<template>
  <div class="adm-add-library-sheet">
    <div class="adm-add-library-sheet__header">
      <h3 class="adm-add-library-sheet__title">{{ props.title }}</h3>
      <button
        type="button"
        class="adm-add-library-sheet__close"
        :aria-label="props.cancelLabel"
        @click="onCancel"
      >
        <span class="i-heroicons-x-mark" aria-hidden="true" />
      </button>
    </div>

    <div class="adm-add-library-sheet__body">
      <AppBanner
        v-if="formError"
        variant="error"
        :body="formError"
        class="adm-add-library-sheet__banner"
      />

      <form novalidate @submit.prevent="onSubmit">
        <div class="adm-add-library-sheet__fields">
          <AppField :label="props.nameLabel" required>
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="newName"
                :placeholder="props.namePlaceholder"
                :disabled="submitting"
                required
              />
            </template>
          </AppField>

          <AppField :label="props.pathLabel" :help="props.pathHint" required>
            <template #default="slotAttrs">
              <AppInput
                v-bind="slotAttrs"
                v-model="newPath"
                :placeholder="props.pathPlaceholder"
                :disabled="submitting"
                required
              />
            </template>
          </AppField>
        </div>

        <div class="adm-add-library-sheet__foot">
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
            :label="props.submitLabel"
            :loading="submitting"
          />
        </div>
      </form>
    </div>
  </div>

  <!-- Backdrop -->
  <div class="adm-add-library-sheet__backdrop" aria-hidden="true" @click="onCancel" />
</template>

<style lang="scss" scoped>
  $sheet-width-md: 380px;
  $header-height: 52px;
  $close-btn-size: 28px;

  .adm-add-library-sheet {
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

  .adm-add-library-sheet__backdrop {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, transparent, var(--surface-overlay) 50%);
    z-index: calc(var(--z-modal) - 1);
  }
</style>

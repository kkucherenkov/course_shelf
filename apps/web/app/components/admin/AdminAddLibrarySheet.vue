<script setup lang="ts">
  import { ref } from 'vue';
  import { AppDialog, AppBanner, AppField, AppInput, AppButton } from '@app/ui';

  import { isAbsoluteRootPath, normalizeRootPath } from '~/utils/library-register';
  import { registerLibraryRequest, RegisterLibraryError } from '~/composables/useLibraries';

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
    /** Shown when the path is not absolute — the one rule the server enforces. */
    errorPathNotAbsolute: string;
    /** Last resort: the server did not answer at all. */
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
    const name = newName.value.trim();
    // Show the string that will actually be sent — see `pages/libraries.vue`.
    const rootPath = normalizeRootPath(newPath.value);
    newPath.value = rootPath;

    if (!name || !rootPath) {
      formError.value = props.errorRequired;
      return;
    }
    if (!isAbsoluteRootPath(rootPath)) {
      formError.value = props.errorPathNotAbsolute;
      return;
    }

    submitting.value = true;
    formError.value = '';
    try {
      await registerLibraryRequest({ name, rootPath });
      reset();
      emit('registered');
    } catch (error) {
      // `registerLibraryRequest` already resolves a defensive 409 to the
      // existing row — anything that reaches here is a real failure. Quote
      // the server's own problem document; the fallback is for a response
      // that carried no explanation, or one that never arrived at all.
      formError.value =
        error instanceof RegisterLibraryError && error.detail ? error.detail : props.errorRegister;
    } finally {
      submitting.value = false;
    }
  }
</script>

<template>
  <!-- The parent only mounts this component while the sheet should be open
       (`v-if="showSheet"`), so the dialog is always `open` for as long as it
       exists; ESC / backdrop dismissal routes back through `onCancel`. -->
  <AppDialog
    open
    size="sm"
    :title="props.title"
    :dismiss-label="props.cancelLabel"
    @update:open="onCancel"
  >
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
  </AppDialog>
</template>

<style lang="scss" scoped>
  .adm-add-library-sheet__banner {
    margin-bottom: var(--space-2);
  }

  .adm-add-library-sheet__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .adm-add-library-sheet__foot {
    display: flex;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-default);

    > * {
      flex: 1;
    }
  }
</style>

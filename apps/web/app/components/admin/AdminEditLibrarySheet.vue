<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { AppDialog, AppBanner, AppField, AppInput, AppButton } from '@app/ui';
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

  // Composables need an active component instance — call them once here, in
  // setup, and close over the results. Calling `useToast()`/`useI18n()`
  // themselves inside `onSubmit` after an `await` used to fail silently,
  // because `getCurrentInstance()` is already null by then (see #639).
  const toast = useToast();
  const { t } = useI18n();

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
          toast.add({ title: t('pages.admin.libraryDetail.editToast403'), color: 'error' });
          close();
          return;
        }
        if (status === 404) {
          toast.add({ title: t('pages.admin.libraryDetail.editToastGone'), color: 'warning' });
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

      toast.add({ title: t('pages.admin.libraryDetail.editToastSaved'), color: 'success' });
      emit('saved', res.data as LibraryDto);
      close();
    } finally {
      submitting.value = false;
    }
  }
</script>

<template>
  <AppDialog
    :open="props.open"
    size="sm"
    :title="props.title"
    :dismiss-label="props.cancelLabel"
    @update:open="close"
  >
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
        <AppButton type="submit" variant="primary" :label="props.saveLabel" :loading="submitting" />
      </div>
    </form>
  </AppDialog>
</template>

<style lang="scss" scoped>
  .adm-edit-lib-sheet__banner {
    margin-bottom: var(--space-2);
  }

  .adm-edit-lib-sheet__fields {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .adm-edit-lib-sheet__foot {
    display: flex;
    gap: var(--space-2);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-default);

    > * {
      flex: 1;
    }
  }
</style>

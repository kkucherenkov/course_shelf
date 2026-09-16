<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { AppDialog, AppField, AppInput, AppButton } from '@app/ui';
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

  // Composables need an active component instance — call them once here, in
  // setup, and close over the results. Calling `useToast()`/`useI18n()`
  // themselves inside `onConfirm` after an `await` used to fail silently,
  // because `getCurrentInstance()` is already null by then (see #639).
  const toast = useToast();
  const { t } = useI18n();

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
        toast.add({ title: t('pages.admin.libraryDetail.editToastGone'), color: 'error' });
        close();
        return;
      }

      toast.add({ title: t('pages.admin.libraryDetail.removeToastDone'), color: 'success' });
      emit('removed');
      close();
      await navigateTo('/admin/libraries');
    } finally {
      submitting.value = false;
    }
  }
</script>

<template>
  <AppDialog
    :open="props.open"
    size="sm"
    :title="props.dialogTitle"
    :description="props.dialogBody"
    :dismiss-label="props.cancelCta"
    @update:open="close"
  >
    <AppField :label="props.confirmPrompt" required>
      <template #default="slotAttrs">
        <AppInput
          v-bind="slotAttrs"
          v-model="typedName"
          :placeholder="props.library.name"
          autocomplete="off"
          :disabled="submitting"
        />
      </template>
    </AppField>

    <template #footer>
      <AppButton
        type="button"
        variant="ghost"
        :label="props.cancelCta"
        :disabled="submitting"
        @click="close"
      />
      <AppButton
        type="button"
        variant="destructive"
        :label="props.confirmCta"
        :disabled="!confirmEnabled"
        :loading="submitting"
        @click="onConfirm"
      />
    </template>
  </AppDialog>
</template>

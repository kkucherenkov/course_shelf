<script setup lang="ts">
  import { computed } from 'vue';

  import AppButton from '../AppButton/AppButton.vue';
  import AppField from '../AppField/AppField.vue';
  import AppInput from '../AppInput/AppInput.vue';
  import AppTextarea from '../AppTextarea/AppTextarea.vue';

  const props = withDefaults(
    defineProps<{
      front: string;
      back: string;
      /** Disables the form while the create/update request is in flight. */
      submitting?: boolean;
      frontLabel: string;
      backLabel: string;
      frontPlaceholder?: string;
      backPlaceholder?: string;
      saveLabel: string;
      cancelLabel: string;
    }>(),
    {
      submitting: false,
      frontPlaceholder: undefined,
      backPlaceholder: undefined,
    },
  );

  const emit = defineEmits<{
    'update:front': [value: string];
    'update:back': [value: string];
    save: [payload: { front: string; back: string }];
    cancel: [];
  }>();

  const canSave = computed(() => props.front.trim().length > 0 && props.back.trim().length > 0);

  function onSave(): void {
    if (props.submitting || !canSave.value) return;
    emit('save', { front: props.front.trim(), back: props.back.trim() });
  }
</script>

<template>
  <div class="app-flashcard-editor">
    <AppField :label="frontLabel">
      <template #default="slotAttrs">
        <AppInput
          v-bind="slotAttrs"
          :model-value="front"
          :placeholder="frontPlaceholder"
          :disabled="submitting"
          @update:model-value="emit('update:front', $event)"
        />
      </template>
    </AppField>
    <AppField :label="backLabel" class="app-flashcard-editor__back-field">
      <template #default="slotAttrs">
        <AppTextarea
          v-bind="slotAttrs"
          :model-value="back"
          :placeholder="backPlaceholder"
          :disabled="submitting"
          :rows="3"
          @update:model-value="emit('update:back', $event)"
        />
      </template>
    </AppField>
    <div class="app-flashcard-editor__actions">
      <AppButton
        variant="ghost"
        size="sm"
        :label="cancelLabel"
        :disabled="submitting"
        @click="emit('cancel')"
      />
      <AppButton
        variant="primary"
        size="sm"
        :label="saveLabel"
        :loading="submitting"
        :disabled="!canSave"
        @click="onSave"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
  .app-flashcard-editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    &__back-field {
      margin-top: var(--space-1);
    }

    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
    }
  }
</style>

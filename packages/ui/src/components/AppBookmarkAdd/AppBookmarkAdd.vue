<script setup lang="ts">
  import { computed, ref } from 'vue';

  import AppButton from '../AppButton/AppButton.vue';
  import AppInput from '../AppInput/AppInput.vue';

  const props = withDefaults(
    defineProps<{
      /** Current playhead time, in seconds. */
      time: number;
      /** Disables Save while a parent is persisting the bookmark. */
      submitting?: boolean;
      /** Visible placeholder for the label input. */
      placeholder?: string;
    }>(),
    {
      submitting: false,
      placeholder: 'Add a label (optional)',
    },
  );

  const emit = defineEmits<{
    save: [payload: { time: number; label: string }];
    cancel: [];
  }>();

  const label = ref('');

  const formattedTime = computed(() => fmtTime(props.time));

  function fmtTime(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes)}:${String(secs).padStart(2, '0')}`;
  }

  function onSave(): void {
    if (props.submitting) return;
    emit('save', { time: props.time, label: label.value.trim() });
    label.value = '';
  }

  function onCancel(): void {
    label.value = '';
    emit('cancel');
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSave();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  }
</script>

<template>
  <div class="app-bookmark-add" role="group" aria-label="Add bookmark">
    <span class="app-bookmark-add__time">{{ formattedTime }}</span>
    <AppInput
      v-model="label"
      class="app-bookmark-add__input"
      size="sm"
      :placeholder="placeholder"
      :aria-label="placeholder"
      :disabled="submitting"
      @keydown="onKey"
    />
    <AppButton variant="primary" size="sm" label="Save" :loading="submitting" @click="onSave" />
  </div>
</template>

<style scoped lang="scss">
  // Bundle .bm-add parity. Token aliases:
  //   --primary       → --brand-accent
  //   --primary-soft  → --brand-accent-soft
  //   --surface-2     → --surface-raised
  //   --border        → --border-default
  .app-bookmark-add {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) 10px;
    background: var(--surface-raised);
    border: 1px dashed var(--border-default);
    border-radius: var(--radius-md);

    &__time {
      flex-shrink: 0;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background: var(--brand-accent-soft);
      color: var(--brand-accent);
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      font-size: var(--text-sm);
    }

    &__input {
      flex: 1 1 auto;
      min-width: 0;
    }
  }
</style>

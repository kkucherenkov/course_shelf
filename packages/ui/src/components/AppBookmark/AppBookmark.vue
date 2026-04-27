<script setup lang="ts">
  import { computed } from 'vue';

  import IconCS from '../IconCS/IconCS.vue';

  const props = withDefaults(
    defineProps<{
      /** Bookmark position, in seconds. */
      time: number;
      /** Optional human label. */
      label?: string;
      /** When true (default) the hover action row is rendered. */
      editable?: boolean;
    }>(),
    { label: '', editable: true },
  );

  const emit = defineEmits<{
    select: [];
    edit: [];
    delete: [];
  }>();

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

  function onActivate(): void {
    emit('select');
  }

  function onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onActivate();
    }
  }
</script>

<template>
  <div
    class="app-bookmark"
    role="button"
    tabindex="0"
    :aria-label="label ? `Bookmark at ${formattedTime}: ${label}` : `Bookmark at ${formattedTime}`"
    @click="onActivate"
    @keydown="onKey"
  >
    <span class="app-bookmark__time">{{ formattedTime }}</span>
    <span class="app-bookmark__label">{{ label }}</span>
    <div v-if="editable" class="app-bookmark__actions">
      <button
        type="button"
        class="app-bookmark__action"
        aria-label="Edit bookmark"
        @click.stop="emit('edit')"
      >
        <IconCS name="edit" :size="14" />
      </button>
      <button
        type="button"
        class="app-bookmark__action"
        aria-label="Delete bookmark"
        @click.stop="emit('delete')"
      >
        <IconCS name="trash" :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  // Bundle .bm parity. Token aliases (bundle → shipped):
  //   --primary       → --brand-accent
  //   --primary-soft  → --brand-accent-soft
  //   --surface-2     → --surface-raised
  //   --d-fast        → --dur-fast
  .app-bookmark {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--dur-fast);

    &:hover,
    &:focus-visible {
      background: var(--surface-raised);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: -2px;
    }

    &:hover &__actions,
    &:focus-within &__actions {
      opacity: 1;
    }

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

    &__label {
      flex: 1 1 auto;
      min-width: 0;
      font-size: var(--text-sm);
      color: var(--text-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__actions {
      display: flex;
      gap: var(--space-1);
      opacity: 0;
      transition: opacity var(--dur-fast);
      flex-shrink: 0;
    }

    &__action {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      border: 0;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: grid;
      place-items: center;
      transition: background var(--dur-fast);

      &:hover {
        background: var(--surface-overlay);
        color: var(--text-fg);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent);
        outline-offset: 2px;
      }
    }
  }
</style>

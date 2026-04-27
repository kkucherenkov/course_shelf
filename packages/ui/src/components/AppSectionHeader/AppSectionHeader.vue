<script setup lang="ts">
  import { computed } from 'vue';

  import IconCS from '../IconCS/IconCS.vue';

  const props = withDefaults(
    defineProps<{
      /** 1-based section index; padded to 2 digits in the title. */
      idx: number;
      /** Section title. */
      title: string;
      /** Number of lessons in the section. */
      count: number;
      /** Total runtime of the section in seconds. */
      duration: number;
      /** Open/closed state — drives chevron rotation + aria-expanded. */
      open?: boolean;
    }>(),
    { open: true },
  );

  const emit = defineEmits<{ toggle: [] }>();

  const formattedDuration = computed(() => fmtDuration(props.duration));

  const lessonsLabel = computed(() =>
    props.count === 1 ? '1 lesson' : `${String(props.count)} lessons`,
  );

  function fmtDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) {
      return minutes > 0 ? `${String(hours)}h ${String(minutes)}m` : `${String(hours)}h`;
    }
    return `${String(minutes)}m`;
  }

  function onActivate(): void {
    emit('toggle');
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
    class="app-section-header"
    role="button"
    tabindex="0"
    :aria-expanded="open ? 'true' : 'false'"
    :data-open="open"
    @click="onActivate"
    @keydown="onKey"
  >
    <IconCS name="chevron-down" :size="14" class="app-section-header__chev" />
    <div class="app-section-header__title">
      Section {{ String(idx).padStart(2, '0') }} · {{ title }}
    </div>
    <div class="app-section-header__meta">{{ lessonsLabel }} · {{ formattedDuration }}</div>
  </div>
</template>

<style scoped lang="scss">
  // Bundle .lr-section-header contract parity. Token aliases (bundle → shipped):
  //   --border        → --border-default
  //   --text-loud     → --text-fg
  //   --text-muted    → --text-secondary
  //   --d-fast        → --dur-fast
  .app-section-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-2);
    border-bottom: 1px solid var(--border-default);
    cursor: pointer;
    background: transparent;
    width: 100%;
    text-align: inherit;

    &:focus-visible {
      outline: 2px solid var(--brand-accent);
      outline-offset: -2px;
    }

    &__chev {
      flex-shrink: 0;
      color: var(--text-secondary);
      transition: transform var(--dur-fast);
    }

    &[data-open='false'] &__chev {
      transform: rotate(-90deg);
    }

    &__title {
      flex: 1 1 auto;
      min-width: 0;
      font-size: var(--text-md);
      font-weight: 500;
      color: var(--text-fg);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__meta {
      flex-shrink: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }
  }
</style>

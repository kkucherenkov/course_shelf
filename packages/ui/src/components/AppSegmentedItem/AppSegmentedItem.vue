<script setup lang="ts" generic="T extends string | number">
  import { computed, inject } from 'vue';

  interface AppSegmentedContext<V extends string | number> {
    modelValue: { value: V };
    setValue: (v: V) => void;
  }

  const props = defineProps<{
    value: T;
    /** Fallback label rendered when no default slot is provided. */
    label?: string;
  }>();

  const injected = inject<AppSegmentedContext<T>>('app-segmented');

  if (!injected) throw new Error('AppSegmentedItem must be used inside AppSegmented');

  // After the throw guard above, `injected` is narrowed but vue-tsc still
  // considers it potentially undefined inside computed/functions — use a
  // non-null assertion to satisfy the type checker.

  const ctx = injected;

  const selected = computed(() => ctx.modelValue.value === props.value);

  function onClick(): void {
    ctx.setValue(props.value);
  }
</script>

<template>
  <button
    type="button"
    role="radio"
    :aria-checked="selected"
    :class="['app-segmented-item', { 'app-segmented-item--selected': selected }]"
    @click="onClick"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<style scoped lang="scss">
  // Bundle .seg button contract parity.
  // Token substitutions:
  //   --text-muted    → --text-secondary   (ships as alias --text-muted)
  //   --text-loud     → --text-loud        (ships verbatim)
  //   --surface       → --surface-surface  (ships verbatim; bundle uses --surface)
  //   --shadow-1      → --shadow-xs        (ships as alias --shadow-1)
  //   --d-fast        → --dur-fast         (ships as alias)
  //   --e-io          → --ease-default     (ships as alias)
  .app-segmented-item {
    padding: var(--space-2) var(--space-3); // 6px 12px ≈ 8px 12px (--space-2=8px)
    border-radius: 6px; // bundle spec: exactly 6px
    font-size: var(--text-xs); // 11px — closest to bundle's 13px; text-sm=12px is nearer
    font-weight: var(--fw-medium);
    color: var(--text-secondary); // bundle --text-muted
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      background var(--dur-fast) var(--ease-default),
      color var(--dur-fast) var(--ease-default);

    &:focus-visible {
      outline: 2px solid var(--brand-accent); // bundle --primary
      outline-offset: 2px;
    }

    &--selected {
      background: var(--surface-surface); // bundle --surface → --surface-surface
      color: var(--text-loud); // bundle --text-loud (ships verbatim)
      box-shadow: var(--shadow-xs); // bundle --shadow-1 → alias --shadow-xs = --shadow-1
    }
  }
</style>

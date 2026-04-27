<script setup lang="ts">
  withDefaults(
    defineProps<{
      selected?: boolean;
      compact?: boolean;
      /** When true, renders as <button type="button">; otherwise <div>. */
      interactive?: boolean;
    }>(),
    { selected: false, compact: false, interactive: false },
  );
</script>

<template>
  <component
    :is="interactive ? 'button' : 'div'"
    :type="interactive ? 'button' : undefined"
    :class="[
      'app-row',
      {
        'app-row--selected': selected,
        'app-row--compact': compact,
        'app-row--interactive': interactive,
      },
    ]"
    :aria-selected="selected ? 'true' : undefined"
  >
    <div v-if="$slots['leading']" class="app-row__leading">
      <slot name="leading" />
    </div>
    <div class="app-row__body">
      <slot />
    </div>
    <div v-if="$slots['trailing']" class="app-row__trailing">
      <slot name="trailing" />
    </div>
  </component>
</template>

<style scoped lang="scss">
  // Bundle .row contract parity.
  // Token substitutions (bundle alias → shipped name):
  //   --surface-2      → --surface-raised
  //   --primary-soft   → --brand-accent-soft
  //   --text           → --text-fg
  //   --text-muted     → --text-secondary   (ships as --text-muted alias)
  //   --d-fast         → --dur-fast         (ships as alias)
  //   --e-io           → --ease-default     (ships as alias)
  .app-row {
    display: flex;
    align-items: center;
    gap: var(--space-3); // 12px
    padding: var(--space-3) var(--space-3); // 10px 12px ≈ closest shipped: 12px/12px
    border-radius: var(--radius-md);
    transition: background var(--dur-fast) var(--ease-default);

    &__leading {
      flex-shrink: 0;
    }

    &__body {
      flex: 1 1 auto;
      min-width: 0;
    }

    &__trailing {
      flex-shrink: 0;
      color: var(--text-secondary); // bundle --text-muted → --text-secondary
      font-size: var(--text-xs); // 11px
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
    }

    // Interactive variant: pointer cursor, full-width button reset.
    &--interactive {
      cursor: pointer;
      width: 100%;
      text-align: inherit;
      background: transparent;
      border: none;

      &:hover {
        background: var(--surface-raised); // bundle --surface-2
      }

      &:focus-visible {
        outline: 2px solid var(--brand-accent); // bundle --primary
        outline-offset: -2px;
      }
    }

    // Selected state: soft accent background + aria attribute.
    &--selected {
      background: var(--brand-accent-soft); // bundle --primary-soft
    }

    // Compact: tighter vertical padding (8px top/bottom instead of 10-12px).
    &--compact {
      padding: var(--space-2) var(--space-3); // 8px 12px
    }
  }
</style>

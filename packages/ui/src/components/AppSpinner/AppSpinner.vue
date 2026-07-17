<script setup lang="ts">
  withDefaults(
    defineProps<{
      size?: 'sm' | 'md' | 'lg';
      /** Accessible label for screen readers. */
      label?: string;
    }>(),
    { size: 'md', label: 'Loading' },
  );
</script>

<template>
  <span :class="['app-spinner', `app-spinner--${size}`]" role="status" :aria-label="label" />
</template>

<style scoped lang="scss">
  // CSS-only spinner using currentColor so callers can paint it via color property.
  // 650ms is a full-rotation cadence, not a UI transition — no --dur-* step
  // matches (150/200/250/400), so it is a named SCSS variable.
  $rotate-duration: 650ms;

  .app-spinner {
    display: inline-block;
    border: 2px solid currentcolor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: app-spinner-rotate $rotate-duration linear infinite;
    flex-shrink: 0;

    &--sm {
      width: var(--space-3);
      height: var(--space-3);
    }

    &--md {
      width: var(--space-4);
      height: var(--space-4);
    }

    &--lg {
      width: var(--space-5);
      height: var(--space-5);
    }
  }

  @keyframes app-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }
</style>

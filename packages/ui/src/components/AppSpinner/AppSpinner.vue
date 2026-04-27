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
  .app-spinner {
    display: inline-block;
    border: 2px solid currentcolor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: app-spinner-rotate 650ms linear infinite;
    flex-shrink: 0;

    &--sm {
      width: 12px;
      height: 12px;
    }

    &--md {
      width: 16px;
      height: 16px;
    }

    &--lg {
      width: 24px;
      height: 24px;
    }
  }

  @keyframes app-spinner-rotate {
    to {
      transform: rotate(360deg);
    }
  }
</style>

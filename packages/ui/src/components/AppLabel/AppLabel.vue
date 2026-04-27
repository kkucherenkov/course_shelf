<script setup lang="ts">
  type Size = 'sm' | 'md';

  withDefaults(
    defineProps<{
      text: string;
      required?: boolean;
      for?: string;
      size?: Size;
    }>(),
    { required: false, for: undefined, size: 'md' },
  );
</script>

<template>
  <label :for="$props.for" :class="['app-label', `app-label--${size}`]">
    <span class="app-label__text">{{ text }}</span>
    <span v-if="required" class="app-label__required" aria-hidden="true">*</span>
  </label>
</template>

<style lang="scss" scoped>
  .app-label {
    display: inline-flex;
    gap: var(--space-1);
    align-items: baseline;
    color: var(--text-fg);
    font-family: var(--font-sans);
    font-weight: var(--fw-medium);
    letter-spacing: var(--tracking-snug);
    line-height: var(--leading-normal);

    &--sm {
      font-size: var(--text-xs);
    }

    &--md {
      font-size: var(--text-sm);
    }

    &__text {
      display: inline-block;
    }

    &__required {
      color: var(--status-danger);
      font-weight: var(--fw-semibold);
    }
  }
</style>

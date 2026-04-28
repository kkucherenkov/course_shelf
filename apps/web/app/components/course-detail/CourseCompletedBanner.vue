<script setup lang="ts">
  import { IconCS } from '@app/ui';

  defineProps<{
    /** e.g. "All lessons completed · 8h watched" */
    label: string;
  }>();
</script>

<template>
  <div class="course-completed-banner" role="status" aria-live="polite">
    <IconCS
      name="check-circle"
      :size="18"
      class="course-completed-banner__icon"
      aria-hidden="true"
    />
    <span class="course-completed-banner__label">{{ label }}</span>
  </div>
</template>

<style scoped lang="scss">
  .course-completed-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--status-success-soft);
    border: 1px solid var(--status-success-subtle);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--text-fg);

    &__icon {
      flex-shrink: 0;
      color: var(--status-success-fg);
    }

    &__label {
      font-weight: var(--fw-medium);
    }
  }
</style>

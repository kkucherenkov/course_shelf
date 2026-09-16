<script setup lang="ts">
  import { AppButton } from '@app/ui';

  defineProps<{
    /** 'not-started' | 'in-progress' | 'completed' */
    courseState: 'not-started' | 'in-progress' | 'completed';
    /** Label for the primary CTA (Start / Resume — Section N · LM). */
    primaryLabel: string;
    /** Link target for the primary CTA. */
    primaryHref: string;
    markCompleteLabel: string;
    resetProgressLabel: string;
    /** Disables both secondary buttons while a mutation is in flight. */
    mutating?: boolean;
  }>();

  // No confirm dialog in this component: `resetProgress` always fires
  // straight through on click. The gate lives one layer up —
  // `pages/courses/[id].vue` intercepts this emit and shows a confirm dialog
  // before calling the mutation (#624). It used to fire with no gate at all,
  // on the claim that resetting is "fully reversible by rewatching" — false
  // for a 540-lesson course, which has no restore button, only a rewatch.
  const emit = defineEmits<{
    markComplete: [];
    resetProgress: [];
  }>();
</script>

<template>
  <div class="course-actions">
    <!-- Primary CTA — renders as a single anchor via AppButton's `to`. -->
    <AppButton
      :to="primaryHref"
      :label="primaryLabel"
      variant="primary"
      size="lg"
      icon-leading="play"
      class="course-actions__primary"
    />

    <!-- Secondary actions -->
    <div class="course-actions__secondary">
      <AppButton
        :label="markCompleteLabel"
        variant="secondary"
        size="md"
        icon-leading="check-circle"
        :disabled="mutating || courseState === 'completed'"
        :loading="mutating"
        @click="emit('markComplete')"
      />
      <AppButton
        :label="resetProgressLabel"
        variant="ghost"
        size="md"
        icon-leading="refresh"
        :disabled="mutating || courseState === 'not-started'"
        @click="emit('resetProgress')"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
  // Named SCSS variable — exempt from raw-px lint rule.
  $cta-primary-min-width: 180px;

  .course-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__primary {
      // Stretch to a comfortable min-width on the primary CTA
      min-width: $cta-primary-min-width;
    }

    &__secondary {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  }
</style>

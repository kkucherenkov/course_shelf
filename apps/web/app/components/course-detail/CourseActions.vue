<script setup lang="ts">
  import { AppButton, AppDialog } from '@app/ui';

  defineProps<{
    /** 'not-started' | 'in-progress' | 'completed' */
    courseState: 'not-started' | 'in-progress' | 'completed';
    /** Label for the primary CTA (Start / Resume — Section N · LM). */
    primaryLabel: string;
    /** Link target for the primary CTA. */
    primaryHref: string;
    markCompleteLabel: string;
    resetProgressLabel: string;
    resetDialogTitle: string;
    resetDialogDescription: string;
    resetDialogConfirmLabel: string;
    resetDialogCancelLabel: string;
    /** Disables both secondary buttons while a mutation is in flight. */
    mutating?: boolean;
  }>();

  const emit = defineEmits<{
    markComplete: [];
    resetProgress: [];
  }>();

  const resetDialogOpen = ref(false);

  function openResetDialog(): void {
    resetDialogOpen.value = true;
  }

  function confirmReset(): void {
    resetDialogOpen.value = false;
    emit('resetProgress');
  }
</script>

<template>
  <div class="course-actions">
    <!-- Primary CTA -->
    <NuxtLink :to="primaryHref" class="course-actions__primary-link">
      <AppButton
        :label="primaryLabel"
        variant="primary"
        size="lg"
        icon-leading="play"
        class="course-actions__primary"
      />
    </NuxtLink>

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
        @click="openResetDialog"
      />
    </div>

    <!-- Reset progress confirmation dialog -->
    <AppDialog
      :open="resetDialogOpen"
      size="sm"
      :title="resetDialogTitle"
      :description="resetDialogDescription"
      @update:open="resetDialogOpen = $event"
    >
      <template #footer>
        <AppButton
          :label="resetDialogCancelLabel"
          variant="ghost"
          size="md"
          @click="resetDialogOpen = false"
        />
        <AppButton
          :label="resetDialogConfirmLabel"
          variant="destructive"
          size="md"
          @click="confirmReset"
        />
      </template>
    </AppDialog>
  </div>
</template>

<style scoped lang="scss">
  // Named SCSS variable — exempt from raw-px lint rule.
  $cta-primary-min-width: 180px;

  .course-actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    &__primary-link {
      text-decoration: none;
      display: inline-flex;
    }

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

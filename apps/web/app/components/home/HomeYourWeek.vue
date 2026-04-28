<script setup lang="ts">
  import { AppErrorState, AppButton, AppSkeleton } from '@app/ui';
  import type { RowStatus } from '~/composables/useHome';
  import type { YourWeekDto } from '@app/api-client-ts';

  defineProps<{
    data?: YourWeekDto | null | undefined;
    status: RowStatus;
    /** Card heading — already translated. */
    heading: string;
    /** "X min watched" label — already translated (with value interpolated). */
    minutesLabel?: string;
    /** "X lessons completed" label — already translated (with value interpolated). */
    lessonsLabel?: string;
    /** Date range label — already translated. */
    rangeLabel?: string;
    /** Error heading — already translated. */
    errorTitle?: string;
    /** Retry button label — already translated. */
    retryLabel?: string;
  }>();

  const emit = defineEmits<{ retry: [] }>();

  function onRetry(): void {
    emit('retry');
  }
</script>

<template>
  <aside class="home-your-week">
    <h2 class="home-your-week__heading">{{ heading }}</h2>

    <!-- loading -->
    <template v-if="status === 'pending'">
      <div class="home-your-week__skeleton">
        <AppSkeleton width="60%" height="2.5rem" radius="md" />
        <AppSkeleton width="80%" height="1rem" radius="sm" />
        <AppSkeleton width="50%" height="1rem" radius="sm" />
      </div>
    </template>

    <!-- error -->
    <AppErrorState
      v-else-if="status === 'error'"
      :title="errorTitle ?? ''"
      class="home-your-week__error"
    >
      <template #action>
        <AppButton :label="retryLabel" size="sm" variant="secondary" @click="onRetry" />
      </template>
    </AppErrorState>

    <!-- populated -->
    <template v-else-if="status === 'success' && data">
      <p class="home-your-week__minutes">{{ minutesLabel }}</p>
      <p class="home-your-week__lessons">{{ lessonsLabel }}</p>
      <p v-if="rangeLabel" class="home-your-week__range">{{ rangeLabel }}</p>
    </template>
  </aside>
</template>

<style scoped lang="scss">
  .home-your-week {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5) var(--space-4);
    background: var(--surface-raised);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-default);

    &__heading {
      margin: 0;
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      font-size: var(--text-xs);
    }

    &__minutes {
      margin: 0;
      font-size: var(--text-3xl);
      font-weight: var(--fw-bold);
      color: var(--brand-accent);
      line-height: 1;
    }

    &__lessons {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__range {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      opacity: 0.7;
    }

    &__skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    &__error {
      padding: var(--space-3) 0;
    }
  }
</style>

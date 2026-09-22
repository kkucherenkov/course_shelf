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
    /** Error body — already translated. */
    errorBody?: string;
    /** Retry button label — already translated. */
    retryLabel?: string;
    /**
     * Due flashcard count (E29-F01-S03). `undefined` while the count hasn't
     * loaded yet (or failed) — the whole block hides rather than showing a
     * stale/zero count, since this is a secondary data source independent
     * of `data`/`status` above.
     */
    dueCount?: number;
    /** "{n} card due | {n} cards due" — already translated. */
    dueLabel?: string;
    /** CTA to `/flashcards/review` — already translated; shown only when `dueCount > 0`. */
    reviewLabel?: string;
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
      :body="errorBody"
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

    <!-- Due flashcards (E29-F01-S03) — independent of the week-stats fetch
         above, so it renders in whatever state `dueCount` itself reaches. -->
    <div v-if="dueCount !== undefined" class="home-your-week__due">
      <p class="home-your-week__due-label">{{ dueLabel }}</p>
      <AppButton
        v-if="dueCount > 0"
        :label="reviewLabel"
        to="/flashcards/review"
        variant="secondary"
        size="sm"
        class="home-your-week__due-cta"
      />
    </div>
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
      font-size: var(--text-sm);
    }

    &__minutes {
      margin: 0;
      font-size: var(--text-3xl);
      font-weight: var(--fw-bold);
      color: var(--brand-accent);
      line-height: var(--leading-none);
    }

    &__lessons {
      margin: 0;
      font-size: var(--text-base);
      color: var(--text-secondary);
    }

    &__range {
      margin: 0;
      font-size: var(--text-sm);
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

    &__due {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-default);
    }

    &__due-label {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__due-cta {
      align-self: flex-start;
    }
  }
</style>

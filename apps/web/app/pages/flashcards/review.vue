<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
  import {
    AppButton,
    AppEmptyState,
    AppErrorState,
    AppFlashcardReview,
    AppSkeleton,
  } from '@app/ui';

  import { useFlashcardReviewQueue } from '~/composables/useFlashcards';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const toast = useToast();

  const { queue, status, current, total, grading, gradeError, grade, refetch } =
    useFlashcardReviewQueue();

  const isLoading = computed(() => status.value === 'pending' || status.value === 'idle');

  // Two distinct empty states (#775) — the endpoint only ever returns *due*
  // cards, so it can't tell "never created one" apart from "created some,
  // none due right now" on a page that loads with zero either way. `total`
  // is the due-queue size at the *first* successful fetch: if it was ever
  // > 0 this session, the user has cards and just finished today's batch —
  // an unambiguous "done for today". If it was 0 from the start, this
  // defaults to "no cards yet", which is the common case the audit found
  // (0 flashcards, 0 notes in the whole instance) and the safer of the two
  // possible misreads for the rarer case (cards exist, none due yet) — it
  // says "here's how to make one" instead of falsely claiming completion,
  // which was the original bug. Telling the two rarer-case readings apart
  // for certain needs a signal the API doesn't return today (whether the
  // user has ever created a card at all) — flagged in the PR, not silently
  // guessed further than this.
  const hasEverHadDueCards = computed(() => total.value > 0);

  // Controlled here (not internal to AppFlashcardReview) because the keyboard
  // shortcut below has to drive the exact same state a click does.
  const revealed = ref(false);

  function onReveal(): void {
    revealed.value = true;
  }

  async function onGrade(value: number): Promise<void> {
    await grade(value);
    if (gradeError.value) {
      toast.add({ title: t('pages.flashcards.review.gradeError'), color: 'error' });
      return;
    }
    // Next card (if any) starts front-only.
    revealed.value = false;
  }

  // Space/Enter reveals; once revealed, 1-4 grade Again/Hard/Good/Easy — the
  // same four values AppFlashcardReview's own buttons send (0/3/4/5).
  const GRADE_BY_KEY: Record<string, number> = { '1': 0, '2': 3, '3': 4, '4': 5 };

  function onKeydown(event: KeyboardEvent): void {
    if (!current.value || grading.value) return;
    if (!revealed.value) {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        onReveal();
      }
      return;
    }
    const value = GRADE_BY_KEY[event.key];
    if (value !== undefined) {
      event.preventDefault();
      void onGrade(value);
    }
  }

  onMounted(() => {
    globalThis.addEventListener('keydown', onKeydown);
  });
  onBeforeUnmount(() => {
    globalThis.removeEventListener('keydown', onKeydown);
  });

  const remainingLabel = computed(() =>
    t('pages.flashcards.review.remaining', queue.value.length, {
      named: { n: queue.value.length },
    }),
  );
</script>

<template>
  <div class="page-flashcard-review">
    <div class="page-flashcard-review__header">
      <h1 class="page-flashcard-review__title">{{ t('pages.flashcards.review.title') }}</h1>
      <p v-if="status === 'success' && current" class="page-flashcard-review__remaining">
        {{ remainingLabel }}
      </p>
    </div>

    <AppSkeleton
      v-if="isLoading"
      width="100%"
      height="16rem"
      radius="md"
      class="page-flashcard-review__skeleton"
    />

    <AppErrorState
      v-else-if="status === 'error'"
      :title="t('pages.flashcards.review.errorTitle')"
      :body="t('pages.flashcards.review.errorBody')"
    >
      <template #action>
        <AppButton
          :label="t('pages.flashcards.review.retry')"
          variant="secondary"
          @click="refetch"
        />
      </template>
    </AppErrorState>

    <AppEmptyState
      v-else-if="!current && !hasEverHadDueCards"
      icon="circle-stack"
      :title="t('pages.flashcards.review.emptyNeverTitle')"
      :body="t('pages.flashcards.review.emptyNeverBody')"
    >
      <template #action>
        <AppButton
          :label="t('pages.flashcards.review.emptyNeverCta')"
          to="/browse"
          variant="secondary"
        />
      </template>
    </AppEmptyState>

    <AppEmptyState
      v-else-if="!current"
      icon="check-circle"
      :title="t('pages.flashcards.review.emptyDoneTitle')"
      :body="t('pages.flashcards.review.emptyDoneBody')"
    />

    <template v-else>
      <AppFlashcardReview
        :front="current.front"
        :back="current.back"
        :revealed="revealed"
        :grading="grading"
        :reveal-label="t('pages.flashcards.review.reveal')"
        :grade-group-label="t('pages.flashcards.review.gradeGroupLabel')"
        :grade-again-label="t('pages.flashcards.review.gradeAgain')"
        :grade-hard-label="t('pages.flashcards.review.gradeHard')"
        :grade-good-label="t('pages.flashcards.review.gradeGood')"
        :grade-easy-label="t('pages.flashcards.review.gradeEasy')"
        @reveal="onReveal"
        @grade="onGrade"
      />
      <p class="page-flashcard-review__shortcuts">
        {{ t('pages.flashcards.review.shortcutsHint') }}
      </p>
    </template>
  </div>
</template>

<style scoped lang="scss">
  $page-max-w: 40rem;

  .page-flashcard-review {
    max-width: $page-max-w;
    margin: 0 auto;
    padding: var(--space-6) var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-5);

    &__header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-3);
    }

    &__title {
      margin: 0;
      font-size: var(--text-2xl);
      font-weight: var(--fw-semibold);
      color: var(--text-fg);
    }

    &__remaining {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      font-variant-numeric: tabular-nums;
    }

    &__skeleton {
      align-self: stretch;
    }

    &__shortcuts {
      margin: 0;
      text-align: center;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }
  }
</style>

<script setup lang="ts">
  import { computed } from 'vue';

  import AppButton from '../AppButton/AppButton.vue';
  import AppCard from '../AppCard/AppCard.vue';

  type GradeVariant = 'primary' | 'secondary' | 'destructive';

  const props = withDefaults(
    defineProps<{
      front: string;
      back: string;
      /** Whether the back face is showing. Controlled — the page also
       * drives this from a keyboard shortcut, so it isn't internal state. */
      revealed: boolean;
      /** Disables every action while a grade is in flight. */
      grading?: boolean;
      revealLabel?: string;
      /** Accessible name for the grade button group. */
      gradeGroupLabel?: string;
      /** SM-2 grade 0 — "Again": a lapse, resets the streak. */
      gradeAgainLabel?: string;
      /** SM-2 grade 3 — "Hard": passes, minimum ease step. */
      gradeHardLabel?: string;
      /** SM-2 grade 4 — "Good": passes, default ease step. */
      gradeGoodLabel?: string;
      /** SM-2 grade 5 — "Easy": passes, largest ease step. */
      gradeEasyLabel?: string;
    }>(),
    {
      grading: false,
      revealLabel: 'Show answer',
      gradeGroupLabel: 'Grade your recall',
      gradeAgainLabel: 'Again',
      gradeHardLabel: 'Hard',
      gradeGoodLabel: 'Good',
      gradeEasyLabel: 'Easy',
    },
  );

  const emit = defineEmits<{
    reveal: [];
    /** SM-2 quality-of-response, 0..5 — see grade*Label docs for the mapping. */
    grade: [value: number];
  }>();

  // The API's 0..5 scale collapses to four buttons: grades 0-2 are all "a
  // lapse" with an identical scheduling effect (reset to a 1-day interval,
  // streak to 0), so "Again" alone covers them without losing any behaviour
  // the API distinguishes. 3/4/5 keep their exact API meaning.
  const grades = computed<{ value: number; label: string; variant: GradeVariant }[]>(() => [
    { value: 0, label: props.gradeAgainLabel, variant: 'destructive' },
    { value: 3, label: props.gradeHardLabel, variant: 'secondary' },
    { value: 4, label: props.gradeGoodLabel, variant: 'primary' },
    { value: 5, label: props.gradeEasyLabel, variant: 'secondary' },
  ]);

  function onReveal(): void {
    if (props.grading) return;
    emit('reveal');
  }
</script>

<template>
  <AppCard size="lg" class="app-flashcard-review">
    <p class="app-flashcard-review__front">{{ front }}</p>

    <template v-if="revealed">
      <hr class="app-flashcard-review__divider" />
      <p class="app-flashcard-review__back">{{ back }}</p>
      <div class="app-flashcard-review__grades" role="group" :aria-label="gradeGroupLabel">
        <AppButton
          v-for="grade in grades"
          :key="grade.value"
          :variant="grade.variant"
          :label="grade.label"
          :disabled="grading"
          class="app-flashcard-review__grade-btn"
          @click="emit('grade', grade.value)"
        />
      </div>
    </template>
    <AppButton
      v-else
      variant="primary"
      block
      :label="revealLabel"
      :disabled="grading"
      class="app-flashcard-review__reveal"
      @click="onReveal"
    />
  </AppCard>
</template>

<style scoped lang="scss">
  .app-flashcard-review {
    display: flex;
    flex-direction: column;
    max-width: 36rem;
    margin: 0 auto;

    &__front,
    &__back {
      margin: 0;
      text-align: center;
      font-size: var(--text-xl);
      color: var(--text-fg);
      line-height: var(--leading-normal);
    }

    &__divider {
      width: 100%;
      margin: var(--space-5) 0;
      border: none;
      border-top: 1px solid var(--border-default);
    }

    &__back {
      color: var(--brand-accent);
    }

    &__reveal {
      margin-top: var(--space-6);
    }

    &__grades {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-2);
      margin-top: var(--space-6);
    }

    &__grade-btn {
      width: 100%;
    }
  }
</style>

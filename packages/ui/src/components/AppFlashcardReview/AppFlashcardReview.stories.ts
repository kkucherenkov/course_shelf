import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppFlashcardReview from './AppFlashcardReview.vue';

const meta: Meta<typeof AppFlashcardReview> = {
  title: 'Domain/AppFlashcardReview',
  component: AppFlashcardReview,
  render: (args) => ({
    components: { AppFlashcardReview },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 40rem; padding: var(--space-6);"><AppFlashcardReview v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppFlashcardReview>;

export const FrontOnly: Story = {
  args: {
    front: 'What is an aggregate?',
    back: 'A cluster of domain objects treated as a unit for data changes.',
    revealed: false,
  },
};

export const Revealed: Story = {
  args: {
    front: 'What is an aggregate?',
    back: 'A cluster of domain objects treated as a unit for data changes.',
    revealed: true,
  },
};

export const Grading: Story = {
  args: {
    front: 'What is an aggregate?',
    back: 'A cluster of domain objects treated as a unit for data changes.',
    revealed: true,
    grading: true,
  },
};

export const Interactive: Story = {
  render: () => ({
    components: { AppFlashcardReview },
    setup() {
      const revealed = ref(false);
      const lastGrade = ref<number | null>(null);
      return {
        revealed,
        lastGrade,
        onReveal: () => (revealed.value = true),
        onGrade: (value: number) => {
          lastGrade.value = value;
          revealed.value = false;
        },
      };
    },
    template: `
      <div style="max-width: 40rem; padding: var(--space-6);">
        <AppFlashcardReview
          front="What does SM-2 stand for?"
          back="SuperMemo-2, a spaced-repetition scheduling algorithm."
          :revealed="revealed"
          @reveal="onReveal"
          @grade="onGrade"
        />
        <p style="margin-top: var(--space-3); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">
          Last grade: <strong>{{ lastGrade ?? '—' }}</strong>
        </p>
      </div>
    `,
  }),
};

/** Every string the card renders is overridable — here in Russian. */
export const Localised: Story = {
  args: {
    front: 'Что такое агрегат?',
    back: 'Группа доменных объектов, изменяемых как единое целое.',
    revealed: true,
    revealLabel: 'Показать ответ',
    gradeGroupLabel: 'Оцените свой ответ',
    gradeAgainLabel: 'Не вспомнил',
    gradeHardLabel: 'Сложно',
    gradeGoodLabel: 'Хорошо',
    gradeEasyLabel: 'Легко',
  },
};

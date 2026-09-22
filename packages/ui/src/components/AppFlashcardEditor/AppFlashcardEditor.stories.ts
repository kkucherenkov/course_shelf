import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppFlashcardEditor from './AppFlashcardEditor.vue';

const meta: Meta<typeof AppFlashcardEditor> = {
  title: 'Domain/AppFlashcardEditor',
  component: AppFlashcardEditor,
  render: (args) => ({
    components: { AppFlashcardEditor },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 28rem; padding: var(--space-4);"><AppFlashcardEditor v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppFlashcardEditor>;

const LABELS = {
  frontLabel: 'Front',
  backLabel: 'Back',
  saveLabel: 'Save',
  cancelLabel: 'Cancel',
};

export const Empty: Story = {
  args: { ...LABELS, front: '', back: '', frontPlaceholder: 'Question', backPlaceholder: 'Answer' },
};

export const Filled: Story = {
  args: {
    ...LABELS,
    front: 'What is an aggregate?',
    back: 'A cluster of domain objects treated as a unit for data changes.',
  },
};

export const Submitting: Story = {
  args: {
    ...LABELS,
    front: 'What is an aggregate?',
    back: 'A cluster of objects.',
    submitting: true,
  },
};

export const Interactive: Story = {
  render: () => ({
    components: { AppFlashcardEditor },
    setup() {
      const front = ref('');
      const back = ref('');
      const lastEvent = ref('—');
      return {
        front,
        back,
        lastEvent,
        ...LABELS,
        onSave: (payload: { front: string; back: string }) => {
          lastEvent.value = `save: "${payload.front}" / "${payload.back}"`;
        },
        onCancel: () => {
          lastEvent.value = 'cancel';
        },
      };
    },
    template: `
      <div style="max-width: 28rem; padding: var(--space-4);">
        <AppFlashcardEditor
          :front="front"
          :back="back"
          v-bind="{ frontLabel, backLabel, saveLabel, cancelLabel }"
          @update:front="front = $event"
          @update:back="back = $event"
          @save="onSave"
          @cancel="onCancel"
        />
        <p style="margin-top: var(--space-3); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">
          Last event: <strong>{{ lastEvent }}</strong>
        </p>
      </div>
    `,
  }),
};

/** Every string the form renders is overridable — here in Russian. */
export const Localised: Story = {
  args: {
    front: '',
    back: '',
    frontLabel: 'Вопрос',
    backLabel: 'Ответ',
    frontPlaceholder: 'Что спросить?',
    backPlaceholder: 'Что ответить?',
    saveLabel: 'Сохранить',
    cancelLabel: 'Отмена',
  },
};

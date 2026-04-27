import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppBookmarkAdd from './AppBookmarkAdd.vue';

const meta: Meta<typeof AppBookmarkAdd> = {
  title: 'Domain/AppBookmarkAdd',
  component: AppBookmarkAdd,
  render: (args) => ({
    components: { AppBookmarkAdd },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 480px; padding: var(--space-4);"><AppBookmarkAdd v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppBookmarkAdd>;

export const Default: Story = { args: { time: 305 } };

export const Submitting: Story = { args: { time: 305, submitting: true } };

export const HourLong: Story = { args: { time: 3725 } };

export const Interactive: Story = {
  render: () => ({
    components: { AppBookmarkAdd },
    setup() {
      const lastSaved = ref<{ time: number; label: string } | null>(null);
      const lastEvent = ref<string>('—');
      return {
        lastSaved,
        lastEvent,
        onSave: (payload: { time: number; label: string }) => {
          lastSaved.value = payload;
          lastEvent.value = 'save';
        },
        onCancel: () => {
          lastEvent.value = 'cancel';
        },
      };
    },
    template: `
      <div style="max-width: 480px; padding: var(--space-4);">
        <AppBookmarkAdd :time="305" @save="onSave" @cancel="onCancel" />
        <p style="margin-top: var(--space-3); font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary);">
          Last event: <strong>{{ lastEvent }}</strong>
          <span v-if="lastSaved"> · saved {{ lastSaved.time }}s "{{ lastSaved.label || '<empty>' }}"</span>
        </p>
      </div>
    `,
  }),
};

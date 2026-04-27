import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppLessonRow from '../AppLessonRow/AppLessonRow.vue';
import AppSectionHeader from './AppSectionHeader.vue';

const meta: Meta<typeof AppSectionHeader> = {
  title: 'Domain/AppSectionHeader',
  component: AppSectionHeader,
  render: (args) => ({
    components: { AppSectionHeader },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 560px; padding: var(--space-4);"><AppSectionHeader v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppSectionHeader>;

export const Open: Story = {
  args: { idx: 1, title: 'TypeScript foundations', count: 6, duration: 3300, open: true },
};

export const Closed: Story = {
  args: { idx: 2, title: 'Type narrowing', count: 4, duration: 2200, open: false },
};

export const SingleLesson: Story = {
  args: { idx: 3, title: 'Bonus material', count: 1, duration: 540, open: true },
};

export const SubHour: Story = {
  args: { idx: 4, title: 'Quick recap', count: 3, duration: 1380, open: true },
};

export const InteractiveOutline: Story = {
  render: () => ({
    components: { AppSectionHeader, AppLessonRow },
    setup() {
      const open = ref(true);
      return {
        open,
        toggle: () => {
          open.value = !open.value;
        },
      };
    },
    template: `
      <div style="max-width: 560px; padding: var(--space-4);">
        <AppSectionHeader
          :idx="1"
          title="TypeScript foundations"
          :count="3"
          :duration="1145"
          :open="open"
          @toggle="toggle"
        />
        <div v-show="open" style="display: flex; flex-direction: column; gap: var(--space-1); padding-top: var(--space-2);">
          <AppLessonRow :num="1" title="Setting up your editor" :duration="180" state="completed" />
          <AppLessonRow :num="2" title="The TypeScript type system, top-down" :duration="540" state="in-progress" :progress="35" current />
          <AppLessonRow :num="3" title="Discriminated unions in practice" :duration="425" />
        </div>
      </div>
    `,
  }),
};

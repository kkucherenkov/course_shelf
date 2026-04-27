import type { Meta, StoryObj } from '@storybook/vue3';

import AppLessonRow from './AppLessonRow.vue';

const meta: Meta<typeof AppLessonRow> = {
  title: 'Domain/AppLessonRow',
  component: AppLessonRow,
  argTypes: {
    state: {
      control: 'select',
      options: ['not-started', 'in-progress', 'completed', 'locked'],
    },
  },
  render: (args) => ({
    components: { AppLessonRow },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 560px; padding: 16px;"><AppLessonRow v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppLessonRow>;

const base = {
  num: 3,
  title: 'Discriminated unions in practice',
  duration: 425,
};

export const Default: Story = { args: { ...base } };

export const Current: Story = { args: { ...base, current: true } };

export const InProgress: Story = {
  args: { ...base, state: 'in-progress', progress: 42 },
};

export const Completed: Story = { args: { ...base, state: 'completed' } };

export const Locked: Story = { args: { ...base, state: 'locked' } };

export const WithMaterials: Story = { args: { ...base, materials: true } };

export const Loading: Story = { args: { ...base, loading: true } };

export const Stack: Story = {
  render: () => ({
    components: { AppLessonRow },
    template: `
      <div style="max-width: 560px; padding: 16px; display: flex; flex-direction: column; gap: 4px;">
        <AppLessonRow :num="1" title="Setting up your editor" :duration="180" state="completed" materials />
        <AppLessonRow :num="2" title="The TypeScript type system, top-down" :duration="540" state="in-progress" :progress="35" current />
        <AppLessonRow :num="3" title="Discriminated unions in practice" :duration="425" />
        <AppLessonRow :num="4" title="Conditional types and infer" :duration="612" />
        <AppLessonRow :num="5" title="Module augmentation (premium)" :duration="338" state="locked" />
      </div>
    `,
  }),
};

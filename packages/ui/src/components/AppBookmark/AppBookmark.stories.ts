import type { Meta, StoryObj } from '@storybook/vue3';

import AppBookmark from './AppBookmark.vue';

const meta: Meta<typeof AppBookmark> = {
  title: 'Domain/AppBookmark',
  component: AppBookmark,
  render: (args) => ({
    components: { AppBookmark },
    setup() {
      return { args };
    },
    template: `<div style="max-width: 480px; padding: var(--space-4);"><AppBookmark v-bind="args" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppBookmark>;

export const Default: Story = {
  args: { time: 305, label: 'Quorum reads worked example' },
};

export const NoLabel: Story = { args: { time: 90 } };

export const ReadOnly: Story = {
  args: { time: 612, label: 'Diagram redraw', editable: false },
};

export const Stack: Story = {
  render: () => ({
    components: { AppBookmark },
    template: `
      <div style="max-width: 480px; padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-1);">
        <AppBookmark :time="42" label="Definition of consensus" />
        <AppBookmark :time="305" label="Quorum reads worked example" />
        <AppBookmark :time="612" label="Diagram redraw" />
        <AppBookmark :time="930" />
      </div>
    `,
  }),
};

import AppProgressCircle from './AppProgressCircle.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppProgressCircle> = {
  title: 'Primitives/AppProgressCircle',
  component: AppProgressCircle,
  tags: ['autodocs'],
  args: {
    value: 65,
    size: 32,
    stroke: 3,
    label: 'Course completion',
  },
};

export default meta;

type Story = StoryObj<typeof AppProgressCircle>;

export const Default: Story = {};

export const Large: Story = {
  args: { value: 75, size: 56, stroke: 4 },
};

export const AllStates: Story = {
  render: () => ({
    components: { AppProgressCircle },
    template: `
      <div style="display:flex;gap:var(--space-5);align-items:center;flex-wrap:wrap;">
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppProgressCircle :value="0" label="0%" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">0%</span>
        </div>
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppProgressCircle :value="25" label="25%" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">25%</span>
        </div>
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppProgressCircle :value="50" label="50%" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">50%</span>
        </div>
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppProgressCircle :value="75" label="75%" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">75%</span>
        </div>
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppProgressCircle :value="100" label="100%" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">100%</span>
        </div>
        <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:var(--space-2);">
          <AppProgressCircle :value="65" :size="48" :stroke="4" label="Large 65%" />
          <span style="font-size:var(--text-xs);color:var(--text-secondary);">lg 65%</span>
        </div>
      </div>
    `,
  }),
};

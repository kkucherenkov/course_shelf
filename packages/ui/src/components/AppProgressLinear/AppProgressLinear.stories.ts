import AppProgressLinear from './AppProgressLinear.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppProgressLinear> = {
  title: 'Primitives/AppProgressLinear',
  component: AppProgressLinear,
  tags: ['autodocs'],
  args: {
    value: 60,
    thin: false,
    label: 'Loading progress',
  },
};

export default meta;

type Story = StoryObj<typeof AppProgressLinear>;

export const Default: Story = {};

export const HalfComplete: Story = {
  args: { value: 50 },
};

export const Thin: Story = {
  args: { value: 75, thin: true },
};

export const Indeterminate: Story = {
  args: { value: undefined, label: 'Loading…' },
};

export const AllStates: Story = {
  render: () => ({
    components: { AppProgressLinear },
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);max-width:320px;">
        <div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-1);">0%</div>
          <AppProgressLinear :value="0" />
        </div>
        <div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-1);">42%</div>
          <AppProgressLinear :value="42" />
        </div>
        <div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-1);">100%</div>
          <AppProgressLinear :value="100" />
        </div>
        <div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-1);">Thin + 60%</div>
          <AppProgressLinear :value="60" :thin="true" />
        </div>
        <div>
          <div style="font-size:var(--text-xs);color:var(--text-secondary);margin-bottom:var(--space-1);">Indeterminate</div>
          <AppProgressLinear :value="undefined" />
        </div>
      </div>
    `,
  }),
};

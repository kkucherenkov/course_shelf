import type { Meta, StoryObj } from '@storybook/vue3';

import AppProgressBadge from './AppProgressBadge.vue';

const meta: Meta<typeof AppProgressBadge> = {
  title: 'Domain/AppProgressBadge',
  component: AppProgressBadge,
  argTypes: {
    variant: { control: { type: 'select' }, options: ['ring', 'bar', 'pill'] },
    state: {
      control: { type: 'select' },
      options: ['not-started', 'in-progress', 'completed', 'locked'],
    },
    completed: { control: { type: 'number' } },
    total: { control: { type: 'number' } },
  },
  args: { variant: 'pill', state: 'in-progress', completed: 4, total: 12 },
};
export default meta;

type Story = StoryObj<typeof AppProgressBadge>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => ({
    components: { AppProgressBadge },
    setup() {
      const variants = ['ring', 'bar', 'pill'] as const;
      const states = ['not-started', 'in-progress', 'completed', 'locked'] as const;
      return { variants, states };
    },
    template: `
      <div style="display: grid; grid-template-columns: 100px repeat(4, 1fr); gap: var(--space-4); align-items: center; padding: var(--space-4);">
        <div></div>
        <div v-for="s in states" :key="s" style="font-size: var(--text-sm); color: var(--text-secondary); text-transform: uppercase;">{{ s }}</div>
        <template v-for="v in variants" :key="v">
          <div style="font-size: var(--text-sm); color: var(--text-secondary); text-transform: uppercase;">{{ v }}</div>
          <div v-for="s in states" :key="v + s" style="display: flex; align-items: center;">
            <AppProgressBadge :variant="v" :state="s" :completed="4" :total="12" />
          </div>
        </template>
      </div>
    `,
  }),
};

export const RingInProgress: Story = { args: { variant: 'ring', state: 'in-progress' } };
export const RingCompleted: Story = { args: { variant: 'ring', state: 'completed' } };
export const RingLocked: Story = { args: { variant: 'ring', state: 'locked' } };

export const BarInProgress: Story = {
  render: () => ({
    components: { AppProgressBadge },
    template: `
      <div style="width: 240px; padding: var(--space-4);">
        <AppProgressBadge variant="bar" state="in-progress" :completed="7" :total="20" />
      </div>
    `,
  }),
};

export const PillCompleted: Story = { args: { variant: 'pill', state: 'completed' } };
export const PillLocked: Story = { args: { variant: 'pill', state: 'locked' } };

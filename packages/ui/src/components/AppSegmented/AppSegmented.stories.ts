import { ref } from 'vue';

import AppSegmentedItem from '../AppSegmentedItem/AppSegmentedItem.vue';
import AppSegmented from './AppSegmented.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

// AppSegmented is a generic SFC (T extends string | number).
// Cast to `any` so Storybook's Meta type can resolve a concrete prop signature.
type AppSegmentedAny = typeof AppSegmented;

const meta: Meta<AppSegmentedAny> = {
  title: 'Primitives/AppSegmented',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic SFC workaround
  component: AppSegmented as any,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AppSegmentedAny>;

export const Default: Story = {
  render: () => ({
    components: { AppSegmented, AppSegmentedItem },
    setup() {
      const active = ref('list');
      return { active };
    },
    template: `
      <div style="display:flex;flex-direction:column;gap:var(--space-4);align-items:flex-start;">
        <AppSegmented v-model="active" label="View mode">
          <AppSegmentedItem value="list" label="List" />
          <AppSegmentedItem value="grid" label="Grid" />
          <AppSegmentedItem value="compact" label="Compact" />
        </AppSegmented>
        <div style="font-size:var(--text-sm);color:var(--text-secondary);">
          Selected: <strong>{{ active }}</strong>
        </div>
      </div>
    `,
  }),
};

export const TwoOptions: Story = {
  render: () => ({
    components: { AppSegmented, AppSegmentedItem },
    setup() {
      const active = ref('day');
      return { active };
    },
    template: `
      <AppSegmented v-model="active" label="Time range">
        <AppSegmentedItem value="day" label="Day" />
        <AppSegmentedItem value="week" label="Week" />
      </AppSegmented>
    `,
  }),
};

export const ManyOptions: Story = {
  render: () => ({
    components: { AppSegmented, AppSegmentedItem },
    setup() {
      const active = ref('1x');
      return { active };
    },
    template: `
      <AppSegmented v-model="active" label="Playback speed">
        <AppSegmentedItem value="0.5x" label="0.5×" />
        <AppSegmentedItem value="0.75x" label="0.75×" />
        <AppSegmentedItem value="1x" label="1×" />
        <AppSegmentedItem value="1.25x" label="1.25×" />
        <AppSegmentedItem value="1.5x" label="1.5×" />
        <AppSegmentedItem value="2x" label="2×" />
      </AppSegmented>
    `,
  }),
};

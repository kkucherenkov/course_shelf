import AppRow from './AppRow.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppRow> = {
  title: 'Primitives/AppRow',
  component: AppRow,
  tags: ['autodocs'],
  args: {
    selected: false,
    compact: false,
    interactive: false,
  },
  render: (args) => ({
    components: { AppRow },
    setup() {
      return { args };
    },
    template: `
      <AppRow v-bind="args">
        <template #leading>
          <div style="width:32px;height:32px;border-radius:50%;background:var(--surface-overlay);" />
        </template>
        <div>
          <div style="font-size:var(--text-md);font-weight:500;color:var(--text-loud);">Course title</div>
          <div style="font-size:var(--text-sm);color:var(--text-secondary);">Author Name</div>
        </div>
        <template #trailing>42%</template>
      </AppRow>
    `,
  }),
};

export default meta;

type Story = StoryObj<typeof AppRow>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Compact: Story = {
  args: { compact: true },
};

export const Interactive: Story = {
  args: { interactive: true },
  render: (args) => ({
    components: { AppRow },
    setup() {
      return { args };
    },
    template: `
      <div style="max-width:360px;display:flex;flex-direction:column;gap:2px;">
        <AppRow v-bind="args">
          <template #leading>
            <div style="width:32px;height:32px;border-radius:50%;background:var(--surface-overlay);" />
          </template>
          <div style="font-size:var(--text-md);font-weight:500;color:var(--text-loud);">Design Fundamentals</div>
          <template #trailing>7h 12m</template>
        </AppRow>
        <AppRow v-bind="args" :selected="true">
          <template #leading>
            <div style="width:32px;height:32px;border-radius:50%;background:var(--brand-accent-soft);" />
          </template>
          <div style="font-size:var(--text-md);font-weight:500;color:var(--text-loud);">Vue 3 Masterclass</div>
          <template #trailing>3h 45m</template>
        </AppRow>
      </div>
    `,
  }),
};

export const NoSlots: Story = {
  render: (args) => ({
    components: { AppRow },
    setup() {
      return { args };
    },
    template: `
      <AppRow v-bind="args">
        Only a body slot — no leading or trailing.
      </AppRow>
    `,
  }),
};

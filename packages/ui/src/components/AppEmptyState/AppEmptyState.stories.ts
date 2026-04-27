import AppEmptyState from './AppEmptyState.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppEmptyState> = {
  title: 'Primitives/AppEmptyState',
  component: AppEmptyState,
  tags: ['autodocs'],
  args: {
    title: 'No courses yet',
    body: 'Start by adding your first course to the library.',
    icon: 'folder',
  },
};

export default meta;

type Story = StoryObj<typeof AppEmptyState>;

export const Default: Story = {};

export const WithAction: Story = {
  render: (args) => ({
    components: { AppEmptyState },
    setup() {
      return { args };
    },
    template: `
      <AppEmptyState v-bind="args">
        <template #action>
          <button style="padding:var(--space-2) var(--space-4);background:var(--brand-accent);color:var(--brand-accent-fg);border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:var(--fw-medium);">
            Add course
          </button>
        </template>
      </AppEmptyState>
    `,
  }),
};

export const NoBody: Story = {
  args: {
    title: 'Nothing to show',
    body: undefined,
  },
};

export const CustomIllustration: Story = {
  render: (args) => ({
    components: { AppEmptyState },
    setup() {
      return { args };
    },
    template: `
      <AppEmptyState v-bind="args">
        <template #illustration>
          <div style="width:64px;height:64px;border-radius:var(--radius-md);background:var(--surface-overlay);display:flex;align-items:center;justify-content:center;font-size:32px;">📚</div>
        </template>
      </AppEmptyState>
    `,
  }),
};

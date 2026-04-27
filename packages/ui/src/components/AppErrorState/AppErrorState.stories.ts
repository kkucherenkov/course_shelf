import AppErrorState from './AppErrorState.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppErrorState> = {
  title: 'Primitives/AppErrorState',
  component: AppErrorState,
  tags: ['autodocs'],
  args: {
    title: 'Something went wrong',
    body: 'We could not load the content. Please try again.',
    icon: 'alert',
  },
};

export default meta;

type Story = StoryObj<typeof AppErrorState>;

export const Default: Story = {};

export const WithRetryAction: Story = {
  render: (args) => ({
    components: { AppErrorState },
    setup() {
      return { args };
    },
    template: `
      <AppErrorState v-bind="args">
        <template #action>
          <button style="padding:var(--space-2) var(--space-4);background:var(--status-error-fg);color:var(--brand-accent-fg);border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:var(--fw-medium);">
            Try again
          </button>
        </template>
      </AppErrorState>
    `,
  }),
};

export const NetworkError: Story = {
  args: {
    icon: 'wifi-off',
    title: 'No connection',
    body: 'Check your internet connection and try again.',
  },
};

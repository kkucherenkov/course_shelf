import AppNoPermission from './AppNoPermission.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppNoPermission> = {
  title: 'Primitives/AppNoPermission',
  component: AppNoPermission,
  tags: ['autodocs'],
  args: {
    title: 'Access restricted',
    body: 'You do not have permission to view this content.',
    icon: 'lock',
  },
};

export default meta;

type Story = StoryObj<typeof AppNoPermission>;

export const Default: Story = {};

export const WithLoginAction: Story = {
  render: (args) => ({
    components: { AppNoPermission },
    setup() {
      return { args };
    },
    template: `
      <AppNoPermission v-bind="args">
        <template #action>
          <button style="padding:var(--space-2) var(--space-4);background:var(--status-warning-fg);color:var(--brand-accent-fg);border:none;border-radius:var(--radius-md);cursor:pointer;font-weight:var(--fw-medium);">
            Log in
          </button>
        </template>
      </AppNoPermission>
    `,
  }),
};

export const ShieldVariant: Story = {
  args: {
    icon: 'shield',
    title: 'Premium content',
    body: 'Upgrade your plan to access this course.',
  },
};

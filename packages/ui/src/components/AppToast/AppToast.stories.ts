import type { Meta, StoryObj } from '@storybook/vue3';

import AppToast from './AppToast.vue';

const VARIANTS = ['success', 'info', 'error'] as const;

const meta: Meta<typeof AppToast> = {
  title: 'Feedback/AppToast',
  component: AppToast,
  tags: ['autodocs'],
  args: {
    message: 'Changes saved successfully.',
    variant: 'info',
    dismissible: false,
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    message: { control: 'text' },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof AppToast>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => ({
    components: { AppToast },
    setup: () => ({ args, variants: VARIANTS }),
    template: `
      <div style="display:flex; flex-direction:column; gap:var(--space-3); align-items:flex-start;">
        <AppToast
          v-for="v in variants"
          :key="v"
          v-bind="args"
          :variant="v"
          :message="v + ' — ' + args.message"
        />
      </div>
    `,
  }),
};

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'File uploaded successfully.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'Failed to connect to the server.',
  },
};

export const Dismissible: Story = {
  args: {
    variant: 'info',
    message: 'New version available. Refresh to update.',
    dismissible: true,
  },
};

export const DismissibleAllVariants: Story = {
  render: (args) => ({
    components: { AppToast },
    setup: () => ({ args, variants: VARIANTS }),
    template: `
      <div style="display:flex; flex-direction:column; gap:var(--space-3); align-items:flex-start;">
        <AppToast
          v-for="v in variants"
          :key="v"
          v-bind="args"
          :variant="v"
          :message="v + ' — dismissible'"
          :dismissible="true"
        />
      </div>
    `,
  }),
};

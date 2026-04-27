import type { Meta, StoryObj } from '@storybook/vue3';

import AppAlert from './AppAlert.vue';

const VARIANTS = ['info', 'success', 'warning', 'error'] as const;

const meta: Meta<typeof AppAlert> = {
  title: 'Feedback/AppAlert',
  component: AppAlert,
  tags: ['autodocs'],
  args: {
    message: 'This field is required.',
    variant: 'error',
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    message: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof AppAlert>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => ({
    components: { AppAlert },
    setup: () => ({ args, variants: VARIANTS }),
    template: `
      <div style="display:flex; flex-direction:column; gap:var(--space-2); align-items:flex-start;">
        <AppAlert
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

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'Password must be at least 8 characters.',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    message: 'Email address is valid.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    message: 'This username is already taken.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    message: 'This field is required.',
  },
};

export const InFormContext: Story = {
  render: (args) => ({
    components: { AppAlert },
    setup: () => ({ args }),
    template: `
      <div style="display:flex; flex-direction:column; gap:var(--space-1); max-width:320px;">
        <label style="font-size:var(--text-sm); font-weight:var(--fw-medium); color:var(--text-fg);">
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          style="padding:6px 10px; border:1px solid var(--error); border-radius:var(--radius-sm); font-size:var(--text-sm);"
        />
        <AppAlert v-bind="args" variant="error" message="Please enter a valid email address." />
      </div>
    `,
  }),
};

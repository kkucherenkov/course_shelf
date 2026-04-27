import AppAvatar from './AppAvatar.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

const meta: Meta<typeof AppAvatar> = {
  title: 'Primitives/AppAvatar',
  component: AppAvatar,
  tags: ['autodocs'],
  args: {
    name: 'John Doe',
    size: 'md',
    role: undefined,
    image: undefined,
    initials: undefined,
  },
  argTypes: {
    image: { control: 'text' },
    initials: { control: 'text' },
    name: { control: 'text' },
    size: { control: 'select', options: SIZES },
    role: { control: 'select', options: [undefined, 'admin', 'guest'] },
  },
};

export default meta;

type Story = StoryObj<typeof AppAvatar>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    image: 'https://i.pravatar.cc/150?img=3',
    name: 'Jane Smith',
  },
};

export const InitialsFallback: Story = {
  args: {
    name: 'Mary Jane Watson',
  },
};

export const ExplicitInitials: Story = {
  args: {
    initials: 'ZZ',
  },
};

export const AllSizes: Story = {
  render: (args) => ({
    components: { AppAvatar },
    setup: () => ({ args, sizes: SIZES }),
    template: `
      <div style="display: flex; gap: var(--space-4); align-items: center;">
        <AppAvatar v-for="s in sizes" :key="s" v-bind="args" :size="s" />
      </div>
    `,
  }),
};

export const WithRoleBadge: Story = {
  render: (args) => ({
    components: { AppAvatar },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: var(--space-5); align-items: center;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
          <AppAvatar v-bind="args" role="admin" size="lg" />
          <span style="font-size: 12px; color: var(--text-secondary);">Admin</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
          <AppAvatar v-bind="args" role="guest" size="lg" />
          <span style="font-size: 12px; color: var(--text-secondary);">Guest</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
          <AppAvatar v-bind="args" size="lg" />
          <span style="font-size: 12px; color: var(--text-secondary);">No role</span>
        </div>
      </div>
    `,
  }),
};

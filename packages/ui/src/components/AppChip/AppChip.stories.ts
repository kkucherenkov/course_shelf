import AppChip from './AppChip.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const VARIANTS = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

const meta: Meta<typeof AppChip> = {
  title: 'Primitives/AppChip',
  component: AppChip,
  tags: ['autodocs'],
  args: { label: 'Chip' },
  argTypes: {
    label: { control: 'text' },
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: SIZES },
    icon: {
      control: 'select',
      options: [undefined, 'check', 'check-circle', 'info', 'alert', 'clock', 'user'],
      description: 'Optional IconCS name rendered on the leading side.',
    },
    removable: { control: 'boolean' },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AppChip>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: (args) => ({
    components: { AppChip },
    setup: () => ({ args, variants: VARIANTS }),
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
        <AppChip v-for="v in variants" :key="v" v-bind="args" :variant="v" :label="v" />
      </div>
    `,
  }),
};

export const AllSizes: Story = {
  render: (args) => ({
    components: { AppChip },
    setup: () => ({ args, sizes: SIZES }),
    template: `
      <div style="display: flex; gap: var(--space-4); align-items: center;">
        <AppChip v-for="s in sizes" :key="s" v-bind="args" :size="s" :label="s" />
      </div>
    `,
  }),
};

export const WithIcon: Story = {
  args: {
    icon: 'check',
    variant: 'success',
    label: 'Verified',
  },
};

export const Removable: Story = {
  args: {
    removable: true,
    variant: 'primary',
    label: 'Filter: In-progress',
  },
};

export const Selected: Story = {
  args: {
    selected: true,
    variant: 'primary',
    label: 'Picked',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    variant: 'default',
    label: 'Unavailable',
  },
};

export const AllVariantsWithIcon: Story = {
  render: (args) => ({
    components: { AppChip },
    setup: () => ({
      args,
      variants: VARIANTS,
      icons: ['info', 'check-circle', 'check', 'alert', 'alert', 'info'],
    }),
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center;">
        <AppChip
          v-for="(v, i) in variants"
          :key="v"
          v-bind="args"
          :variant="v"
          :icon="icons[i]"
          :label="v"
        />
      </div>
    `,
  }),
};

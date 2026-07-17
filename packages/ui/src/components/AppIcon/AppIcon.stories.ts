import AppIcon from './AppIcon.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppIcon> = {
  title: 'Primitives/AppIcon',
  component: AppIcon,
  tags: ['autodocs'],
  args: { name: 'i-lucide-check' },
  argTypes: {
    name: {
      control: 'text',
      description: 'Iconify collection name. Convention: `i-lucide-*` for the primary glyph set.',
    },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    label: {
      control: 'text',
      description: 'Accessible label. When empty, the icon is marked `aria-hidden`.',
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppIcon>;

export const Default: Story = {};

export const Sizes: Story = {
  render: (args) => ({
    components: { AppIcon },
    setup: () => ({ args }),
    template: `
      <div style="display:flex; gap: var(--space-5); align-items:center;">
        <AppIcon v-bind="args" size="xs" />
        <AppIcon v-bind="args" size="sm" />
        <AppIcon v-bind="args" size="md" />
        <AppIcon v-bind="args" size="lg" />
        <AppIcon v-bind="args" size="xl" />
      </div>
    `,
  }),
};

export const WithLabel: Story = {
  args: { name: 'i-lucide-shield-check', label: 'Verified account' },
};

export const ColorInheritance: Story = {
  render: (args) => ({
    components: { AppIcon },
    setup: () => ({ args }),
    template: `
      <div style="display:flex; gap: var(--space-5); align-items:center;">
        <span style="color: var(--color-accent);"><AppIcon v-bind="args" /></span>
        <span style="color: var(--color-success);"><AppIcon v-bind="args" /></span>
        <span style="color: var(--color-danger);"><AppIcon v-bind="args" /></span>
      </div>
    `,
  }),
};

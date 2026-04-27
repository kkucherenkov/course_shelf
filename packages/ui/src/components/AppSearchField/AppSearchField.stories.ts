import AppSearchField from './AppSearchField.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppSearchField> = {
  title: 'Forms/AppSearchField',
  component: AppSearchField,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    label: 'Search',
    placeholder: 'Search courses…',
    required: false,
    disabled: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AppSearchField>;

export const Default: Story = {
  args: { modelValue: '' },
};

export const Filled: Story = {
  args: { modelValue: 'Introduction to Vue 3' },
};

export const Error: Story = {
  args: { modelValue: '', error: 'Search query too short.' },
};

export const Disabled: Story = {
  args: { modelValue: '', disabled: true },
};

export const DensityCompact: Story = {
  render: (args) => ({
    components: { AppSearchField },
    setup() {
      return { args };
    },
    template: `
      <div data-density="compact">
        <AppSearchField v-bind="args" label="Compact search" placeholder="30px height" />
      </div>
    `,
  }),
};

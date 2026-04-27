import AppNumberField from './AppNumberField.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppNumberField> = {
  title: 'Forms/AppNumberField',
  component: AppNumberField,
  tags: ['autodocs'],
  args: {
    modelValue: 5,
    label: 'Quantity',
    min: 0,
    max: 100,
    step: 1,
    required: false,
    disabled: false,
    size: 'md',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    modelValue: { control: 'number' },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
};

export default meta;

type Story = StoryObj<typeof AppNumberField>;

export const Default: Story = {};

export const AtMinBoundary: Story = {
  args: { modelValue: 0, min: 0 },
};

export const AtMaxBoundary: Story = {
  args: { modelValue: 100, max: 100 },
};

export const Error: Story = {
  args: { modelValue: null, error: 'Value is required.' },
};

export const Disabled: Story = {
  args: { modelValue: 5, disabled: true },
};

export const DensityCompact: Story = {
  render: (args) => ({
    components: { AppNumberField },
    setup() {
      return { args };
    },
    template: `
      <div data-density="compact">
        <AppNumberField v-bind="args" label="Compact number" />
      </div>
    `,
  }),
};

import AppTextField from './AppTextField.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppTextField> = {
  title: 'Forms/AppTextField',
  component: AppTextField,
  tags: ['autodocs'],
  args: {
    modelValue: '',
    label: 'Full name',
    placeholder: 'Jane Doe',
    required: false,
    disabled: false,
    size: 'md',
    type: 'text',
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'tel', 'url'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof AppTextField>;

export const Default: Story = {
  args: { modelValue: '' },
};

export const Filled: Story = {
  args: { modelValue: 'Jane Doe' },
};

export const Error: Story = {
  args: { modelValue: '', error: 'This field is required.' },
};

export const WithHelp: Story = {
  args: { modelValue: '', help: 'Enter your full legal name.' },
};

export const Disabled: Story = {
  args: { modelValue: 'Jane Doe', disabled: true },
};

export const Required: Story = {
  args: { modelValue: '', required: true },
};

/**
 * Demonstrates the 30px compact height when wrapped in a [data-density="compact"] parent.
 */
export const DensityCompact: Story = {
  render: (args) => ({
    components: { AppTextField },
    setup() {
      return { args };
    },
    template: `
      <div data-density="compact">
        <AppTextField v-bind="args" label="Compact field" placeholder="30px height" />
      </div>
    `,
  }),
};

import AppCheckbox from './AppCheckbox.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppCheckbox> = {
  title: 'Forms/AppCheckbox',
  component: AppCheckbox,
  tags: ['autodocs'],
  args: {
    modelValue: false,
    label: 'Accept terms and conditions',
    indeterminate: false,
    disabled: false,
    required: false,
  },
  argTypes: {
    modelValue: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    label: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof AppCheckbox>;

export const Default: Story = {
  args: { modelValue: false },
};

export const Checked: Story = {
  args: { modelValue: true },
};

export const Indeterminate: Story = {
  args: { modelValue: false, indeterminate: true, label: 'Select all' },
};

export const Error: Story = {
  args: { modelValue: false, label: 'I agree' },
  render: (args) => ({
    components: { AppCheckbox },
    setup() {
      return { args };
    },
    template: `
      <AppCheckbox v-bind="args" aria-invalid="true" aria-describedby="cb-err" />
      <p id="cb-err" style="color:var(--status-error-fg);font-size:var(--text-sm);margin-top:var(--space-1);">
        You must accept the terms.
      </p>
    `,
  }),
};

export const Disabled: Story = {
  args: { modelValue: false, disabled: true },
};

export const DisabledChecked: Story = {
  args: { modelValue: true, disabled: true },
};

import { ref } from 'vue';

import type { Meta, StoryObj } from '@storybook/vue3';

import AppPasswordField from './AppPasswordField.vue';

const meta: Meta<typeof AppPasswordField> = {
  title: 'Domain/AppPasswordField',
  component: AppPasswordField,
  args: {
    modelValue: '',
    label: 'Password',
    withMeter: false,
    autoComplete: 'current-password',
  },
  argTypes: {
    autoComplete: {
      control: { type: 'select' },
      options: ['current-password', 'new-password'],
    },
  },
  render: (args) => ({
    components: { AppPasswordField },
    setup() {
      const value = ref(args.modelValue);
      return { args, value };
    },
    template: `<div style="max-width: 360px; padding: var(--space-4);"><AppPasswordField v-bind="args" v-model="value" /></div>`,
  }),
};
export default meta;

type Story = StoryObj<typeof AppPasswordField>;

export const Empty: Story = {};

export const FilledMasked: Story = { args: { modelValue: 'sup3r-secret!' } };

export const Disabled: Story = { args: { modelValue: 'cannot-touch', disabled: true } };

export const Error: Story = {
  args: { modelValue: 'short', error: 'Password must be at least 8 characters.' },
};

export const WithHint: Story = {
  args: { modelValue: '', hint: 'Use a memorable phrase rather than a single word.' },
};

export const WithMeterEmpty: Story = {
  args: { modelValue: '', withMeter: true, autoComplete: 'new-password' },
};

export const WithMeterWeak: Story = {
  args: { modelValue: 'abcdef', withMeter: true, autoComplete: 'new-password' },
};

export const WithMeterOkay: Story = {
  args: { modelValue: 'abcdefghij', withMeter: true, autoComplete: 'new-password' },
};

export const WithMeterStrong: Story = {
  args: { modelValue: 'abcdefghijkl1!', withMeter: true, autoComplete: 'new-password' },
};

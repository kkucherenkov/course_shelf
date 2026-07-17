import { ref } from 'vue';

import AppSwitch from './AppSwitch.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppSwitch> = {
  title: 'Primitives/AppSwitch',
  component: AppSwitch,
  tags: ['autodocs'],
  args: { modelValue: false },
  argTypes: {
    modelValue: { control: 'boolean', description: 'Current on/off state.' },
    label: {
      control: 'text',
      description:
        'When provided, renders beside the switch and forwards label clicks to the control.',
    },
    disabled: { control: 'boolean' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    color: { control: 'select', options: ['primary', 'success', 'neutral'] },
  },
};

export default meta;

type Story = StoryObj<typeof AppSwitch>;

// A tiny v-model host — makes every story interactive so the playground's
// binding arrow actually updates the control.
export const Default: Story = {
  render: (args) => ({
    components: { AppSwitch },
    setup: () => {
      const checked = ref(false);
      return { args, checked };
    },
    template: `<AppSwitch v-bind="args" v-model="checked" />`,
  }),
};

export const WithLabel: Story = {
  args: { label: 'Email notifications' },
  render: (args) => ({
    components: { AppSwitch },
    setup: () => {
      const checked = ref(false);
      return { args, checked };
    },
    template: `<AppSwitch v-bind="args" v-model="checked" />`,
  }),
};

export const Checked: Story = {
  args: { label: 'SMS alerts' },
  render: (args) => ({
    components: { AppSwitch },
    setup: () => {
      const checked = ref(true);
      return { args, checked };
    },
    template: `<AppSwitch v-bind="args" v-model="checked" />`,
  }),
};

export const Disabled: Story = {
  args: { label: 'Sync over cellular', disabled: true },
  render: (args) => ({
    components: { AppSwitch },
    setup: () => {
      const checked = ref(false);
      return { args, checked };
    },
    template: `<AppSwitch v-bind="args" v-model="checked" />`,
  }),
};

export const Sizes: Story = {
  render: (args) => ({
    components: { AppSwitch },
    setup: () => {
      const sm = ref(true);
      const md = ref(true);
      const lg = ref(true);
      return { args, sm, md, lg };
    },
    template: `
      <div style="display:flex; gap: var(--space-5); align-items:center;">
        <AppSwitch v-bind="args" v-model="sm" size="sm" />
        <AppSwitch v-bind="args" v-model="md" size="md" />
        <AppSwitch v-bind="args" v-model="lg" size="lg" />
      </div>
    `,
  }),
};

export const Colors: Story = {
  render: (args) => ({
    components: { AppSwitch },
    setup: () => {
      const primary = ref(true);
      const success = ref(true);
      const neutral = ref(true);
      return { args, primary, success, neutral };
    },
    template: `
      <div style="display:flex; gap: var(--space-5); align-items:center;">
        <AppSwitch v-bind="args" v-model="primary" color="primary" label="Primary" />
        <AppSwitch v-bind="args" v-model="success" color="success" label="Success" />
        <AppSwitch v-bind="args" v-model="neutral" color="neutral" label="Neutral" />
      </div>
    `,
  }),
};

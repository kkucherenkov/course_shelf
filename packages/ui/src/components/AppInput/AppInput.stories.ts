import { expect, userEvent, within } from 'storybook/test';

import AppField from '../AppField/AppField.vue';

import AppInput from './AppInput.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppInput> = {
  title: 'Primitives/AppInput',
  component: AppInput,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'tel', 'url', 'search', 'number', 'date', 'time'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
  },
  args: {
    modelValue: '',
    type: 'text',
    size: 'md',
  },
};

export default meta;

type Story = StoryObj<typeof AppInput>;

export const Default: Story = {
  render: (args) => ({
    components: { AppInput },
    setup: () => ({ args }),
    template: `<AppInput v-bind="args" aria-label="Example input" />`,
  }),
};

export const WithPlaceholder: Story = {
  args: { placeholder: '+357 99 123 456' },
  render: (args) => ({
    components: { AppInput },
    setup: () => ({ args }),
    template: `<AppInput v-bind="args" aria-label="Example input" />`,
  }),
};

export const WithValue: Story = {
  args: { modelValue: 'user@example.com', type: 'email' },
  render: (args) => ({
    components: { AppInput },
    setup: () => ({ args }),
    template: `<AppInput v-bind="args" aria-label="Example input" />`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { AppInput },
    template: `
      <div style="display: grid; gap: var(--space-4); max-width: 320px;">
        <AppInput size="sm" :model-value="''" placeholder="Small" />
        <AppInput size="md" :model-value="''" placeholder="Medium" />
        <AppInput size="lg" :model-value="''" placeholder="Large" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: 'Not editable' },
  render: (args) => ({
    components: { AppInput },
    setup: () => ({ args }),
    template: `<AppInput v-bind="args" aria-label="Example input" />`,
  }),
};

export const Readonly: Story = {
  args: { readonly: true, modelValue: 'Read-only value' },
  render: (args) => ({
    components: { AppInput },
    setup: () => ({ args }),
    template: `<AppInput v-bind="args" aria-label="Example input" />`,
  }),
};

export const Types: Story = {
  render: () => ({
    components: { AppInput },
    template: `
      <div style="display: grid; gap: var(--space-4); max-width: 320px;">
        <AppInput type="text"     :model-value="''" placeholder="text" />
        <AppInput type="email"    :model-value="''" placeholder="email" />
        <AppInput type="password" :model-value="''" placeholder="password" />
        <AppInput type="tel"      :model-value="''" placeholder="tel (+357 99 123 456)" />
        <AppInput type="search"   :model-value="''" placeholder="search" />
        <AppInput type="number"   :model-value="''" placeholder="number" />
      </div>
    `,
  }),
};

export const KeyboardInteraction: Story = {
  args: { placeholder: 'Tab here, then type' },
  render: (args) => ({
    components: { AppInput },
    setup: () => ({ args }),
    template: `<AppInput v-bind="args" data-testid="kbd-input" />`,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByTestId('kbd-input') as HTMLInputElement;
    await userEvent.tab();
    await expect(input).toHaveFocus();
    await userEvent.keyboard('hello');
    await expect(input).toHaveValue('hello');
  },
};

export const ComposedWithAppField: Story = {
  render: () => ({
    components: { AppField, AppInput },
    template: `
      <div style="display: grid; gap: var(--space-6); max-width: 360px;">
        <AppField label="Phone number" help="Include the country code, e.g. +357 99 123 456." :required="true">
          <template #default="slotAttrs">
            <AppInput v-bind="slotAttrs" type="tel" :model-value="''" placeholder="+357 99 123 456" />
          </template>
        </AppField>
        <AppField label="Email" error="Please enter a valid email address.">
          <template #default="slotAttrs">
            <AppInput v-bind="slotAttrs" type="email" :model-value="'not-an-email'" />
          </template>
        </AppField>
        <AppField label="Name">
          <template #default="slotAttrs">
            <AppInput v-bind="slotAttrs" :model-value="''" placeholder="Your name" :disabled="true" />
          </template>
        </AppField>
      </div>
    `,
  }),
};

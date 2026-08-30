import AppField from '../AppField/AppField.vue';

import AppTextarea from './AppTextarea.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppTextarea> = {
  title: 'Primitives/AppTextarea',
  component: AppTextarea,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    resize: { control: 'select', options: ['none', 'vertical', 'horizontal', 'both'] },
    rows: { control: 'number' },
    maxRows: { control: 'number' },
    autoGrow: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
  },
  args: {
    modelValue: '',
    rows: 3,
    size: 'md',
    resize: 'vertical',
  },
};

export default meta;

type Story = StoryObj<typeof AppTextarea>;

// A long chunk of copy used to prove the auto-grow story; keeping it here
// (not a literal inline in a story) so every story that needs filler copy
// reads from the same source.
const FILLER_PARAGRAPH =
  'Tell us about the booking context. What should the provider know before the appointment, and are there any accessibility needs we should plan for in advance?';

export const Default: Story = {
  render: (args) => ({
    components: { AppTextarea },
    setup: () => ({ args }),
    template: `<AppTextarea v-bind="args" aria-label="Example textarea" />`,
  }),
};

export const WithPlaceholder: Story = {
  args: { placeholder: 'Share any notes for your provider…' },
  render: (args) => ({
    components: { AppTextarea },
    setup: () => ({ args }),
    template: `<AppTextarea v-bind="args" aria-label="Example textarea" />`,
  }),
};

export const WithValue: Story = {
  args: { modelValue: FILLER_PARAGRAPH },
  render: (args) => ({
    components: { AppTextarea },
    setup: () => ({ args }),
    template: `<AppTextarea v-bind="args" aria-label="Example textarea" />`,
  }),
};

export const AutoGrow: Story = {
  args: { autoGrow: true, maxRows: 8, modelValue: FILLER_PARAGRAPH },
  render: (args) => ({
    components: { AppTextarea },
    setup: () => ({ args }),
    template: `<AppTextarea v-bind="args" aria-label="Example textarea" />`,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { AppTextarea },
    setup: () => ({ placeholder: 'Type here…' }),
    template: `
      <div style="display: grid; gap: var(--space-4);">
        <AppTextarea size="sm" :model-value="''" :placeholder="placeholder" />
        <AppTextarea size="md" :model-value="''" :placeholder="placeholder" />
        <AppTextarea size="lg" :model-value="''" :placeholder="placeholder" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true, modelValue: 'Disabled content' },
  render: (args) => ({
    components: { AppTextarea },
    setup: () => ({ args }),
    template: `<AppTextarea v-bind="args" aria-label="Example textarea" />`,
  }),
};

export const Readonly: Story = {
  args: { readonly: true, modelValue: 'Read-only content' },
  render: (args) => ({
    components: { AppTextarea },
    setup: () => ({ args }),
    template: `<AppTextarea v-bind="args" aria-label="Example textarea" />`,
  }),
};

export const ResizeModes: Story = {
  render: () => ({
    components: { AppTextarea },
    template: `
      <div style="display: grid; gap: var(--space-4);">
        <AppTextarea :model-value="''" resize="none" placeholder="resize=none" />
        <AppTextarea :model-value="''" resize="vertical" placeholder="resize=vertical" />
        <AppTextarea :model-value="''" resize="horizontal" placeholder="resize=horizontal" />
        <AppTextarea :model-value="''" resize="both" placeholder="resize=both" />
      </div>
    `,
  }),
};

export const ComposedWithAppField: Story = {
  render: () => ({
    components: { AppField, AppTextarea },
    setup: () => ({
      label: 'Booking notes',
      help: 'Visible only to your provider',
      error: 'Notes must be at least 20 characters',
      required: true,
      placeholder: 'Add context for the appointment…',
    }),
    template: `
      <div style="display: grid; gap: var(--space-6); max-width: 480px;">
        <AppField :label="label" :help="help" :required="required">
          <template #default="slotAttrs">
            <AppTextarea v-bind="slotAttrs" :model-value="''" :placeholder="placeholder" />
          </template>
        </AppField>
        <AppField :label="label" :error="error" :required="required">
          <template #default="slotAttrs">
            <AppTextarea v-bind="slotAttrs" :model-value="'short'" :placeholder="placeholder" />
          </template>
        </AppField>
      </div>
    `,
  }),
};

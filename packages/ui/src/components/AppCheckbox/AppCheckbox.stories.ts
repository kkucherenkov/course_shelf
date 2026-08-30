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
  parameters: {
    a11y: {
      config: {
        // WCAG 2.2 SC 1.4.3 Contrast (Minimum) exempts "incidental" text —
        // text that is "part of an inactive user interface component". The
        // label is dimmed by `opacity: var(--opacity-disabled)` on the
        // wrapper, which axe composites against the page and reports as a
        // 2.46:1 failure; it cannot see that the control it belongs to is
        // disabled. Darkening the disabled state to satisfy the tool would
        // remove the one signal that says the control is unavailable.
        //
        // Scoped to this story and to this one rule, per the note in
        // `.storybook/preview.ts`: never widen the global setting.
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
};

export const DisabledChecked: Story = {
  args: { modelValue: true, disabled: true },
  parameters: {
    a11y: {
      config: {
        // WCAG 2.2 SC 1.4.3 Contrast (Minimum) exempts "incidental" text —
        // text that is "part of an inactive user interface component". The
        // label is dimmed by `opacity: var(--opacity-disabled)` on the
        // wrapper, which axe composites against the page and reports as a
        // 2.46:1 failure; it cannot see that the control it belongs to is
        // disabled. Darkening the disabled state to satisfy the tool would
        // remove the one signal that says the control is unavailable.
        //
        // Scoped to this story and to this one rule, per the note in
        // `.storybook/preview.ts`: never widen the global setting.
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
};

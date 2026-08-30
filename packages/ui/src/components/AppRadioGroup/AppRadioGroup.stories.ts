import { ref } from 'vue';
import AppRadio from '../AppRadio/AppRadio.vue';
import AppRadioGroup from './AppRadioGroup.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

// AppRadioGroup is generic (T extends string | number). We pin to `string` here
// so Storybook's Meta type can resolve a concrete prop signature.
type AppRadioGroupString = typeof AppRadioGroup;

const meta: Meta<AppRadioGroupString> = {
  title: 'Forms/AppRadioGroup',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: AppRadioGroup as any,
  tags: ['autodocs'],
  args: {
    modelValue: 'apple',
    name: 'fruit',
    label: 'Pick a fruit',
    disabled: false,
  },
  argTypes: {
    disabled: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<AppRadioGroupString>;

export const Default: Story = {
  render: (args) => ({
    components: { AppRadioGroup, AppRadio },
    setup() {
      const selected = ref((args.modelValue as string) ?? 'apple');
      return { args, selected };
    },
    template: `
      <AppRadioGroup v-bind="args" v-model="selected" name="fruit" label="Pick a fruit">
        <AppRadio value="apple" label="Apple" />
        <AppRadio value="banana" label="Banana" />
        <AppRadio value="cherry" label="Cherry" />
      </AppRadioGroup>
      <p style="margin-top:var(--space-2);font-size:var(--text-sm);color:var(--text-secondary)">
        Selected: {{ selected }}
      </p>
    `,
  }),
};

export const Disabled: Story = {
  render: () => ({
    components: { AppRadioGroup, AppRadio },
    setup() {
      const selected = ref('banana');
      return { selected };
    },
    template: `
      <AppRadioGroup v-model="selected" name="fruit" label="Disabled group" :disabled="true">
        <AppRadio value="apple" label="Apple" />
        <AppRadio value="banana" label="Banana" />
        <AppRadio value="cherry" label="Cherry" />
      </AppRadioGroup>
    `,
  }),
};

export const WithOneDisabledOption: Story = {
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
  render: () => ({
    components: { AppRadioGroup, AppRadio },
    setup() {
      const selected = ref('apple');
      return { selected };
    },
    template: `
      <AppRadioGroup v-model="selected" name="fruit" label="Some disabled">
        <AppRadio value="apple" label="Apple" />
        <AppRadio value="banana" label="Banana (unavailable)" :disabled="true" />
        <AppRadio value="cherry" label="Cherry" />
      </AppRadioGroup>
    `,
  }),
};

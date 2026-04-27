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
      <p style="margin-top:8px;font-size:12px;color:var(--text-secondary)">
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

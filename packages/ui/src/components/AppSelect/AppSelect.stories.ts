import { ref } from 'vue';

import AppField from '../AppField/AppField.vue';

import AppSelect, { type AppSelectOption } from './AppSelect.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppSelect> = {
  title: 'Primitives/AppSelect',
  component: AppSelect,
  tags: ['autodocs'],
  argTypes: {
    modelValue: { control: 'text' },
    placeholder: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'AppSelect is the brand dropdown primitive.',
          '',
          'It wraps a native `<select>` (styled via tokens) so it inherits the',
          "browser's full accessibility contract: keyboard nav, focus,",
          'screen-reader announcements, and native menu rendering on every platform.',
          '',
          'Translations come in as the `placeholder` prop and each option `label`.',
          'Compose inside `AppField` to link label + help/error + ARIA wiring.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppSelect>;

const FRUITS: readonly AppSelectOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry' },
  { id: 'durian', label: 'Durian' },
];

const FRUITS_WITH_DISABLED: readonly AppSelectOption[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'cherry', label: 'Cherry (seasonal)', disabled: true },
  { id: 'durian', label: 'Durian' },
];

// Single-story bootstrap — the stories consume a local ref so the change
// handler updates the rendered value like a real app would. `args` is typed
// via Storybook as `Partial<typeof AppSelect.props>` which is too loose to be
// useful here, so we narrow to the one field we read.
interface SelectArgs {
  modelValue?: string | null;
}
const singleSelectRender: Story['render'] = (rawArgs) => {
  const args = rawArgs as SelectArgs;
  return {
    components: { AppSelect },
    setup() {
      const value = ref<string | null>(args.modelValue ?? null);
      return { args, value, options: FRUITS };
    },
    template: `
      <div style="width: 280px;">
        <AppSelect v-bind="args" v-model="value" :options="options" />
        <p style="margin-top: var(--space-4); color: var(--text-secondary); font-family: var(--font-mono); font-size: var(--text-xs);">
          modelValue: {{ value ?? 'null' }}
        </p>
      </div>
    `,
  };
};

export const Default: Story = {
  args: { modelValue: null },
  render: singleSelectRender,
};

export const WithPlaceholder: Story = {
  args: { modelValue: null, placeholder: 'Pick a fruit…' },
  render: singleSelectRender,
};

export const WithValue: Story = {
  args: { modelValue: 'banana', placeholder: 'Pick a fruit…' },
  render: singleSelectRender,
};

export const Sizes: Story = {
  render: () => ({
    components: { AppSelect },
    setup() {
      const values = ref({ sm: null, md: null, lg: null } as Record<string, string | null>);
      return { values, options: FRUITS };
    },
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--space-8); width: 280px;">
        <AppSelect size="sm" placeholder="Small" :options="options" v-model="values.sm" />
        <AppSelect size="md" placeholder="Medium" :options="options" v-model="values.md" />
        <AppSelect size="lg" placeholder="Large" :options="options" v-model="values.lg" />
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { modelValue: 'apple', disabled: true },
  render: singleSelectRender,
};

export const WithDisabledOption: Story = {
  render: () => ({
    components: { AppSelect },
    setup() {
      const value = ref<string | null>(null);
      return { value, options: FRUITS_WITH_DISABLED };
    },
    template: `
      <div style="width: 280px;">
        <AppSelect v-model="value" :options="options" placeholder="Pick a fruit…" />
      </div>
    `,
  }),
};

export const ComposedWithAppField: Story = {
  render: () => ({
    components: { AppField, AppSelect },
    setup() {
      const value = ref<string | null>(null);
      const error = ref<string | undefined>(undefined);
      const onChange = (): void => {
        error.value = undefined;
      };
      const validate = (): void => {
        error.value = value.value ? undefined : 'Please pick a fruit.';
      };
      return { value, error, onChange, validate, options: FRUITS };
    },
    template: `
      <div style="display:flex; flex-direction:column; gap: var(--space-6); width: 320px;">
        <AppField label="Favourite fruit" required :error="error" help="This ends up on your profile.">
          <template #default="a">
            <AppSelect
              v-bind="a"
              v-model="value"
              :options="options"
              placeholder="Pick a fruit…"
              @update:model-value="onChange"
            />
          </template>
        </AppField>
        <button type="button" @click="validate" style="align-self:flex-start; padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); background: var(--brand-accent); color: var(--text-inverse); border: 0; cursor: pointer;">
          Validate
        </button>
      </div>
    `,
  }),
};

import { ref } from 'vue';

import AppField from '../AppField/AppField.vue';

import AppComboBox, { type ComboBoxOption } from './AppComboBox.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const INSTRUCTORS: ComboBoxOption[] = [
  { id: 'alice', label: 'Alice Nguyen' },
  { id: 'bob', label: 'Bob Fischer' },
  { id: 'carol', label: 'Carol Weiss' },
  { id: 'dan', label: 'Dan Popescu (on leave)', disabled: true },
];

const meta: Meta<typeof AppComboBox> = {
  title: 'Forms/AppComboBox',
  component: AppComboBox,
  tags: ['autodocs'],
  args: {
    modelValue: [],
    items: INSTRUCTORS,
    searchTerm: '',
    placeholder: 'Search…',
    listboxLabel: 'Instructors',
  },
  argTypes: {
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component: [
          'AppComboBox is the ARIA combobox primitive for async multi-select:',
          '`role="combobox"` on the input, a sibling `role="listbox"`, and',
          '`aria-activedescendant` to highlight an option without moving DOM',
          'focus off the input.',
          '',
          "It never fetches — `items`/`loading` come from the consumer's own",
          'search composable, and `search-term` is a plain v-model.',
          '',
          '`autofocus` is used below purely to force the listbox open for the',
          'story; a real form leaves that to the user.',
        ].join('\n'),
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AppComboBox>;

// Local ref-backed render so picking/removing in the Storybook canvas
// actually updates what's shown — same pattern as AppSelect's stories.
interface ComboArgs {
  modelValue?: string[];
  items?: ComboBoxOption[];
  searchTerm?: string;
}
function statefulRender(extraAttrs = ''): Story['render'] {
  return (rawArgs) => {
    const args = rawArgs as ComboArgs;
    return {
      components: { AppComboBox },
      setup() {
        const modelValue = ref<string[]>(args.modelValue ?? []);
        const searchTerm = ref(args.searchTerm ?? '');
        return { args, modelValue, searchTerm };
      },
      template: `
        <div style="width: 360px;">
          <AppComboBox
            v-bind="args"
            v-model="modelValue"
            v-model:search-term="searchTerm"
            aria-label="Instructors"
            ${extraAttrs}
          />
        </div>
      `,
    };
  };
}

export const Empty: Story = {
  args: { modelValue: [], items: [] },
  render: statefulRender(),
};

export const Loading: Story = {
  args: { modelValue: [], items: [], loading: true },
  render: statefulRender('autofocus'),
};

export const HasResults: Story = {
  args: { modelValue: [] },
  render: statefulRender('autofocus'),
};

export const NoResultsFound: Story = {
  args: { modelValue: [], items: [], searchTerm: 'zzzznotfound' },
  render: statefulRender('autofocus'),
};

export const WithSelectedChips: Story = {
  args: { modelValue: ['alice', 'carol'] },
  render: statefulRender(),
};

export const Disabled: Story = {
  args: { modelValue: ['alice'], disabled: true },
  render: statefulRender(),
};

export const ComposedWithAppField: Story = {
  render: () => ({
    components: { AppField, AppComboBox },
    setup() {
      const modelValue = ref<string[]>([]);
      const searchTerm = ref('');
      return { modelValue, searchTerm, items: INSTRUCTORS };
    },
    template: `
      <div style="width: 360px;">
        <AppField label="Instructors" help="Search by name.">
          <template #default="slotAttrs">
            <AppComboBox
              v-bind="slotAttrs"
              v-model="modelValue"
              v-model:search-term="searchTerm"
              :items="items"
              placeholder="Search…"
            />
          </template>
        </AppField>
      </div>
    `,
  }),
};

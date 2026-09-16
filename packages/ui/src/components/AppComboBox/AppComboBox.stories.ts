import { nextTick, onMounted, ref } from 'vue';

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
          'The "open" stories below call `.focus()` on mount rather than the',
          "HTML `autofocus` attribute — the browser's own autofocus timing",
          'for a script-inserted element is not guaranteed to land before a',
          'screenshot fires, and the visual-regression baseline generated in',
          'CI caught exactly that: `HasResults` came back byte-identical to',
          '`Empty`, a closed control. An explicit `.focus()` call has no such',
          'race. The wrapper also reserves height for the popup panel, which',
          'is `position: absolute` and otherwise falls outside the',
          'screenshot — without it, every "open" baseline looks closed too.',
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
// Tall enough for the control (~44px) plus the popup panel's full
// $listbox-max-height (240px, see AppComboBox.vue) — the panel is
// `position: absolute` so it never grows this wrapper on its own; without
// an explicit reservation, a screenshot of the wrapper crops the panel out
// entirely, open or not.
const OPEN_WRAPPER_STYLE = 'width: 360px; min-height: 320px;';

function statefulRender(startOpen = false): Story['render'] {
  return (rawArgs) => {
    const args = rawArgs as ComboArgs;
    return {
      components: { AppComboBox },
      setup() {
        const modelValue = ref<string[]>(args.modelValue ?? []);
        const searchTerm = ref(args.searchTerm ?? '');
        const rootEl = ref<HTMLElement | null>(null);
        if (startOpen) {
          // A script-inserted `autofocus` attribute isn't guaranteed to land
          // before a screenshot fires (see the component doc comment above)
          // — an explicit call after mount is deterministic instead.
          onMounted(() => {
            void nextTick(() => rootEl.value?.querySelector('input')?.focus());
          });
        }
        return { args, modelValue, searchTerm, rootEl };
      },
      template: `
        <div ref="rootEl" style="${OPEN_WRAPPER_STYLE}">
          <AppComboBox
            v-bind="args"
            v-model="modelValue"
            v-model:search-term="searchTerm"
            aria-label="Instructors"
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
  render: statefulRender(true),
};

export const HasResults: Story = {
  args: { modelValue: [] },
  render: statefulRender(true),
};

export const NoResultsFound: Story = {
  args: { modelValue: [], items: [], searchTerm: 'zzzznotfound' },
  render: statefulRender(true),
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

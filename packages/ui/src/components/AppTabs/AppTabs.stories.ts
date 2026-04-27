import { ref } from 'vue';

import AppTab from '../AppTab/AppTab.vue';
import AppTabs from './AppTabs.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

// AppTabs is a generic SFC (T extends string | number).
// Cast to `any` so Storybook's Meta type can resolve a concrete prop signature.
type AppTabsAny = typeof AppTabs;

const meta: Meta<AppTabsAny> = {
  title: 'Primitives/AppTabs',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic SFC workaround
  component: AppTabs as any,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<AppTabsAny>;

export const Default: Story = {
  render: () => ({
    components: { AppTabs, AppTab },
    setup() {
      const active = ref('overview');
      return { active };
    },
    template: `
      <div style="max-width:480px;">
        <AppTabs v-model="active" label="Course sections">
          <AppTab value="overview" label="Overview" />
          <AppTab value="curriculum" label="Curriculum" />
          <AppTab value="reviews" label="Reviews" />
        </AppTabs>
        <div style="padding:var(--space-4);font-size:var(--text-sm);color:var(--text-secondary);">
          Active tab: <strong>{{ active }}</strong>
        </div>
      </div>
    `,
  }),
};

export const InitialSecondTab: Story = {
  render: () => ({
    components: { AppTabs, AppTab },
    setup() {
      const active = ref('curriculum');
      return { active };
    },
    template: `
      <AppTabs v-model="active" label="Navigation">
        <AppTab value="overview" label="Overview" />
        <AppTab value="curriculum" label="Curriculum" />
        <AppTab value="reviews" label="Reviews" />
        <AppTab value="notes" label="Notes" />
      </AppTabs>
    `,
  }),
};

export const NumericValues: Story = {
  render: () => ({
    components: { AppTabs, AppTab },
    setup() {
      const active = ref(1);
      return { active };
    },
    template: `
      <AppTabs v-model="active" label="Steps">
        <AppTab :value="1" label="Step 1" />
        <AppTab :value="2" label="Step 2" />
        <AppTab :value="3" label="Step 3" />
      </AppTabs>
    `,
  }),
};

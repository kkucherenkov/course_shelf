import { ref } from 'vue';
import AppDialog from './AppDialog.vue';

import type { Meta, StoryObj } from '@storybook/vue3';

const meta: Meta<typeof AppDialog> = {
  title: 'Primitives/AppDialog',
  component: AppDialog,
  tags: ['autodocs'],
  args: {
    open: false,
    title: 'Dialog title',
    description: undefined,
    size: 'md',
    dismissible: true,
    dismissLabel: 'Close',
  },
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    size: { control: 'radio', options: ['sm', 'md'] },
    dismissible: { control: 'boolean' },
    dismissLabel: { control: 'text' },
  },
};

export default meta;

type Story = StoryObj<typeof AppDialog>;

export const Default: Story = {
  render: (args) => ({
    components: { AppDialog },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div>
        <button @click="open = true" style="padding: var(--space-2) var(--space-4); background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: var(--radius-md); cursor: pointer;">
          Open dialog
        </button>
        <AppDialog v-bind="args" :open="open" @update:open="open = $event">
          <p>Dialog body content goes here.</p>
        </AppDialog>
      </div>
    `,
  }),
};

export const WithDescription: Story = {
  render: (args) => ({
    components: { AppDialog },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div>
        <button @click="open = true" style="padding: var(--space-2) var(--space-4); background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: var(--radius-md); cursor: pointer;">
          Open dialog
        </button>
        <AppDialog v-bind="args" :open="open" description="This is an optional description that provides context." @update:open="open = $event">
          <p>Dialog body content.</p>
        </AppDialog>
      </div>
    `,
  }),
};

export const WithFooter: Story = {
  render: (args) => ({
    components: { AppDialog },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div>
        <button @click="open = true" style="padding: var(--space-2) var(--space-4); background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: var(--radius-md); cursor: pointer;">
          Open dialog
        </button>
        <AppDialog v-bind="args" :open="open" @update:open="open = $event">
          <p>Are you sure you want to proceed?</p>
          <template #footer>
            <button @click="open = false" style="padding: 6px 14px; border: 1px solid var(--border-default); border-radius: 6px; cursor: pointer; background: transparent;">
              Cancel
            </button>
            <button @click="open = false" style="padding: 6px 14px; background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: 6px; cursor: pointer;">
              Confirm
            </button>
          </template>
        </AppDialog>
      </div>
    `,
  }),
};

export const SmallSize: Story = {
  render: (args) => ({
    components: { AppDialog },
    setup() {
      const open = ref(false);
      return { args, open };
    },
    template: `
      <div>
        <button @click="open = true" style="padding: var(--space-2) var(--space-4); background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: var(--radius-md); cursor: pointer;">
          Open small dialog
        </button>
        <AppDialog v-bind="args" :open="open" size="sm" title="Small dialog" @update:open="open = $event">
          <p>Compact dialog content.</p>
        </AppDialog>
      </div>
    `,
  }),
};

export const NonDismissible: Story = {
  render: (args) => ({
    components: { AppDialog },
    setup() {
      const open = ref(true);
      return { args, open };
    },
    template: `
      <div>
        <button @click="open = true" style="padding: var(--space-2) var(--space-4); background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: var(--radius-md); cursor: pointer;">
          Open non-dismissible dialog
        </button>
        <AppDialog v-bind="args" :open="open" :dismissible="false" title="Mandatory action" @update:open="open = $event">
          <p>This dialog cannot be dismissed with ESC or backdrop click.</p>
          <template #footer>
            <button @click="open = false" style="padding: 6px 14px; background: var(--brand-accent); color: var(--brand-accent-fg); border: none; border-radius: 6px; cursor: pointer;">
              I accept
            </button>
          </template>
        </AppDialog>
      </div>
    `,
  }),
};
